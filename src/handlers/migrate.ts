import { ConditionalCheckFailedException, DynamoDB, PutItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb'

import { APIGatewayProxyResultV2 } from '../types'
import { generateId } from '../utils/id-generator'
import { log, logError, xrayCapture } from '../utils/logging'
import status from '../utils/status'

const dynamodb = xrayCapture(new DynamoDB({ apiVersion: '2012-08-10' }))
const sourceTable = process.env.MIGRATION_SOURCE_TABLE as string
const targetTable = process.env.DYNAMODB_TABLE_NAME as string

const MAX_ID_ATTEMPTS = 5

interface OldJokeItem {
  Index: { N: string }
  Data: { S: string }
}

interface ParsedJoke {
  contents: string
  audio?: {
    base64: string
    contentType: string
    version?: string
  }
}

const scanAllItems = async (): Promise<OldJokeItem[]> => {
  const items: OldJokeItem[] = []
  let lastKey: Record<string, any> | undefined

  do {
    const command = new ScanCommand({
      TableName: sourceTable,
      ExclusiveStartKey: lastKey,
    })
    const response = await dynamodb.send(command)
    items.push(...((response.Items as unknown as OldJokeItem[]) ?? []))
    lastKey = response.LastEvaluatedKey
  } while (lastKey)

  return items
}

const writeNewItem = async (joke: ParsedJoke): Promise<string> => {
  for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt++) {
    const id = generateId()
    const item: Record<string, any> = {
      Id: { S: id },
      contents: { S: joke.contents },
      version: { N: '1' },
    }

    if (joke.audio?.base64) {
      item.audioBase64 = { S: joke.audio.base64 }
    }
    if (joke.audio?.contentType) {
      item.audioContentType = { S: joke.audio.contentType }
    }
    if (joke.audio?.version) {
      item.audioVersion = { S: joke.audio.version }
    }

    const command = new PutItemCommand({
      ConditionExpression: 'attribute_not_exists(Id)',
      Item: item,
      TableName: targetTable,
    })

    try {
      await dynamodb.send(command)
      return id
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        log(`ID collision on "${id}", retrying (attempt ${attempt + 1}/${MAX_ID_ATTEMPTS})`)
        continue
      }
      throw error
    }
  }

  throw new Error(`Failed to generate unique ID after ${MAX_ID_ATTEMPTS} attempts`)
}

const writeRoster = async (activeIds: string[]): Promise<void> => {
  const command = new PutItemCommand({
    Item: {
      Id: { S: 'META' },
      activeIds: { L: activeIds.map((id) => ({ S: id })) },
    },
    TableName: targetTable,
  })
  await dynamodb.send(command)
}

export const migrateHandler = async (): Promise<APIGatewayProxyResultV2<unknown>> => {
  log('Migration started', { sourceTable, targetTable })

  try {
    const items = await scanAllItems()
    const jokes = items.filter((item) => item.Index.N !== '0')
    log(`Found ${jokes.length} jokes to migrate`)

    const activeIds: string[] = []

    for (const item of jokes) {
      const parsed: ParsedJoke = JSON.parse(item.Data.S)
      const id = await writeNewItem(parsed)
      activeIds.push(id)
    }

    await writeRoster(activeIds)
    log('Migration complete', { totalMigrated: activeIds.length })

    return {
      ...status.OK,
      body: JSON.stringify({
        migrated: activeIds.length,
        ids: activeIds,
      }),
    }
  } catch (error) {
    logError(error)
    return {
      ...status.INTERNAL_SERVER_ERROR,
      body: JSON.stringify({ message: 'Migration failed', error: String(error) }),
    }
  }
}
