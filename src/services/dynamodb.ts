import {
  AttributeValue,
  BatchGetItemCommand,
  ConditionalCheckFailedException,
  DeleteItemCommand,
  DynamoDB,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb'

import { dynamodbTableName } from '../config'
import { Joke, JokeBatch } from '../types'
import { xrayCapture } from '../utils/logging'

const dynamodb = xrayCapture(new DynamoDB({ apiVersion: '2012-08-10' }))

/* Get items */

export const getJokeById = async (id: string): Promise<Joke> => {
  const command = new GetItemCommand({
    Key: { Id: { S: id } },
    TableName: dynamodbTableName,
  })
  const response = await dynamodb.send(command)
  if (!response.Item) {
    throw new Error('Item not found')
  }
  return {
    audio: response.Item.audioBase64?.S
      ? {
        base64: response.Item.audioBase64.S,
        contentType: response.Item.audioContentType?.S ?? '',
        version: response.Item.audioVersion?.S,
      }
      : undefined,
    contents: response.Item.contents.S as string,
    version: parseInt(response.Item.version.N as string, 10),
  }
}

export const getJokesByIds = async (ids: string[]): Promise<JokeBatch[]> => {
  if (ids.length === 0) return []

  const command = new BatchGetItemCommand({
    RequestItems: {
      [dynamodbTableName]: {
        Keys: ids.map((id) => ({ Id: { S: id } })),
      },
    },
  })
  const response = await dynamodb.send(command)
  const items = response.Responses?.[dynamodbTableName] ?? []

  return items.map((item: Record<string, AttributeValue>) => ({
    data: {
      audio: item.audioBase64?.S
        ? {
          base64: item.audioBase64.S,
          contentType: item.audioContentType?.S ?? '',
          version: item.audioVersion?.S,
        }
        : undefined,
      contents: item.contents.S as string,
      version: parseInt(item.version.N as string, 10),
    },
    id: item.Id.S as string,
  }))
}

export const scanJokes = async (): Promise<JokeBatch[]> => {
  const items: JokeBatch[] = []
  let lastKey: Record<string, any> | undefined

  do {
    const command = new ScanCommand({
      ExclusiveStartKey: lastKey,
      FilterExpression: 'Id <> :meta',
      ExpressionAttributeValues: { ':meta': { S: 'META' } },
      ProjectionExpression: 'Id, contents, version',
      TableName: dynamodbTableName,
    })
    const response = await dynamodb.send(command)
    const pageItems =
      response.Items?.map((item: Record<string, AttributeValue>) => ({
        data: {
          contents: item.contents.S as string,
          version: parseInt(item.version.N as string, 10),
        },
        id: item.Id.S as string,
      })) ?? []
    items.push(...pageItems)
    lastKey = response.LastEvaluatedKey
  } while (lastKey)

  return items
}

/* Create item */

export const putJoke = async (id: string, joke: Joke): Promise<void> => {
  const item: Record<string, any> = {
    Id: { S: id },
    contents: { S: joke.contents },
    version: { N: `${joke.version}` },
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
    TableName: dynamodbTableName,
  })
  await dynamodb.send(command)
}

export { ConditionalCheckFailedException }

/* Update item */

export const updateJoke = async (id: string, joke: Joke, expectedVersion: number): Promise<void> => {
  const expressionValues: Record<string, any> = {
    ':contents': { S: joke.contents },
    ':expectedVersion': { N: `${expectedVersion}` },
    ':newVersion': { N: `${expectedVersion + 1}` },
  }

  let updateExpression = 'SET contents = :contents, version = :newVersion'
  let removeExpression = ''

  if (joke.audio?.base64) {
    expressionValues[':audioBase64'] = { S: joke.audio.base64 }
    expressionValues[':audioContentType'] = { S: joke.audio.contentType }
    updateExpression += ', audioBase64 = :audioBase64, audioContentType = :audioContentType'
    if (joke.audio.version) {
      expressionValues[':audioVersion'] = { S: joke.audio.version }
      updateExpression += ', audioVersion = :audioVersion'
    }
  } else {
    removeExpression = ' REMOVE audioBase64, audioContentType, audioVersion'
  }

  const command = new UpdateItemCommand({
    ConditionExpression: 'version = :expectedVersion',
    ExpressionAttributeValues: expressionValues,
    Key: { Id: { S: id } },
    TableName: dynamodbTableName,
    UpdateExpression: updateExpression + removeExpression,
  })
  await dynamodb.send(command)
}

/* Delete item */

export const deleteJoke = async (id: string): Promise<void> => {
  const command = new DeleteItemCommand({
    Key: { Id: { S: id } },
    TableName: dynamodbTableName,
  })
  await dynamodb.send(command)
}

/* Roster (META item) */

export const getRoster = async (): Promise<string[]> => {
  const command = new GetItemCommand({
    Key: { Id: { S: 'META' } },
    TableName: dynamodbTableName,
  })
  const response = await dynamodb.send(command)
  return response.Item?.activeIds?.L?.map((item: AttributeValue) => item.S as string) ?? []
}

export const getRosterWithVersion = async (): Promise<{ ids: string[]; version: number }> => {
  const command = new GetItemCommand({
    Key: { Id: { S: 'META' } },
    TableName: dynamodbTableName,
  })
  const response = await dynamodb.send(command)
  return {
    ids: response.Item?.activeIds?.L?.map((item: AttributeValue) => item.S as string) ?? [],
    version: parseInt(response.Item?.version?.N ?? '0', 10),
  }
}

export const addToRoster = async (id: string): Promise<void> => {
  const command = new UpdateItemCommand({
    ExpressionAttributeValues: {
      ':id': { L: [{ S: id }] },
      ':empty': { L: [] },
      ':one': { N: '1' },
      ':zero': { N: '0' },
    },
    Key: { Id: { S: 'META' } },
    TableName: dynamodbTableName,
    UpdateExpression:
      'SET activeIds = list_append(if_not_exists(activeIds, :empty), :id), version = if_not_exists(version, :zero) + :one',
  })
  await dynamodb.send(command)
}

export const removeFromRoster = async (id: string): Promise<void> => {
  const { ids, version } = await getRosterWithVersion()
  const updated = ids.filter((item) => item !== id)
  const command = new PutItemCommand({
    ConditionExpression: 'version = :expectedVersion',
    ExpressionAttributeValues: { ':expectedVersion': { N: `${version}` } },
    Item: {
      Id: { S: 'META' },
      activeIds: { L: updated.map((item) => ({ S: item })) },
      version: { N: `${version + 1}` },
    },
    TableName: dynamodbTableName,
  })
  await dynamodb.send(command)
}
