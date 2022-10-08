import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Joke } from '../types'
import { extractJokeFromEvent, getIdFromEvent } from '../utils/events'
import { getDataByIndex, setDataByIndex } from '../services/dynamodb'
import { log, logError } from '../utils/logging'
import status from '../utils/status'

const setJoke = async (index: number, joke: Joke): Promise<APIGatewayProxyResultV2<any>> => {
  try {
    await getDataByIndex(index)
  } catch {
    return status.NOT_FOUND
  }
  try {
    await setDataByIndex(index, joke)
    return { ...status.OK, body: JSON.stringify(joke) }
  } catch (error) {
    logError(error)
    return status.INTERNAL_SERVER_ERROR
  }
}

export const putItemHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2<any>> => {
  log('Received event', { ...event, body: undefined })
  try {
    const index = getIdFromEvent(event)
    const joke = extractJokeFromEvent(event)
    const result = await setJoke(index, joke)
    return result
  } catch (error: any) {
    return { ...status.BAD_REQUEST, body: JSON.stringify({ message: error.message }) }
  }
}
