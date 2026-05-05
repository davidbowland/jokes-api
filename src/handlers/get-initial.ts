import { randomInt } from 'crypto'

import { getJokeById, getRoster } from '../services/dynamodb'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Joke } from '../types'
import { log, logError } from '../utils/logging'
import status from '../utils/status'

export const getInitialHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2<unknown>> => {
  log('Received event', { ...event, body: undefined })
  try {
    const roster = await getRoster()
    if (roster.length === 0) {
      return status.NOT_FOUND
    }
    const id = roster[randomInt(roster.length)]
    const joke: Joke = await getJokeById(id)
    const { version: _, ...jokeData } = joke
    return { ...status.OK, body: JSON.stringify({ count: roster.length, joke: { data: jokeData, id } }) }
  } catch (error) {
    logError(error)
    return status.INTERNAL_SERVER_ERROR
  }
}
