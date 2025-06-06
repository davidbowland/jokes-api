import { randomInt } from 'crypto'

import { getDataByIndex, getHighestIndex } from '../services/dynamodb'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Joke } from '../types'
import { log, logError } from '../utils/logging'
import status from '../utils/status'

export const getInitialHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2<any>> => {
  log('Received event', { ...event, body: undefined })
  try {
    const count = await getHighestIndex()
    if (count === 0) {
      return status.NOT_FOUND
    }
    const index = randomInt(count) + 1 // Jokes start at index 1
    const joke = (await getDataByIndex(index)) as Joke
    return { ...status.OK, body: JSON.stringify({ count, joke: { data: joke, id: index } }) }
  } catch (error) {
    logError(error)
    return status.INTERNAL_SERVER_ERROR
  }
}
