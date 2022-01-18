import { getDataByIndex, setDataByIndex } from '../services/dynamodb'
import status from '../utils/status'
import { APIGatewayEvent, APIGatewayProxyResult, Joke } from '../types'
import { extractJokeFromEvent, getCorsHeaders, getIdFromEvent } from '../utils/events'
import { log, logError } from '../utils/logging'

const setJoke = async (index: number, joke: Joke): Promise<APIGatewayProxyResult> => {
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

export const putItemHandler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  log('Received event', { ...event, body: undefined })
  try {
    const index = await getIdFromEvent(event)
    const joke = await extractJokeFromEvent(event)
    const result = await setJoke(index, joke)
    return { ...getCorsHeaders(event), ...result }
  } catch (error) {
    return { ...getCorsHeaders(event), ...status.BAD_REQUEST, body: JSON.stringify({ message: error }) }
  }
}
