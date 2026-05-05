import { randomInt } from 'crypto'

import { randomCountMaximum } from '../config'
import { getJokesByIds, getRoster } from '../services/dynamodb'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from '../types'
import { log, logError } from '../utils/logging'
import status from '../utils/status'

const pickRandom = (list: string[], count: number): string[] => {
  const picked: string[] = []
  const available = [...list]
  const total = Math.min(count, available.length)

  for (let i = 0; i < total; i++) {
    const idx = randomInt(available.length)
    picked.push(available[idx])
    available.splice(idx, 1)
  }

  return picked
}

export const getRandomHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2<unknown>> => {
  log('Received event', { ...event, body: undefined })
  const count =
    Math.max(Math.min(parseInt(event.queryStringParameters?.count as string, 10), randomCountMaximum), 1) ||
    randomCountMaximum
  const avoidList = event.queryStringParameters?.avoid?.split(',') ?? []

  try {
    const roster = await getRoster()
    if (roster.length === 0) {
      return status.NOT_FOUND
    }
    const available = roster.filter((id) => !avoidList.includes(id))
    if (available.length === 0) {
      return status.NOT_FOUND
    }
    const selectedIds = pickRandom(available, count)
    const jokes = await getJokesByIds(selectedIds)
    const response = jokes.map(({ data: { version: _, ...joke }, id }) => ({ data: joke, id }))
    return { ...status.OK, body: JSON.stringify(response) }
  } catch (error) {
    logError(error)
    return status.INTERNAL_SERVER_ERROR
  }
}
