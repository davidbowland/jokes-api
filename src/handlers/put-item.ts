import { getDataByIndex, setDataByIndex } from '../services/dynamodb'
import status from '../utils/status'
import { APIGatewayEvent, APIGatewayProxyResult, Joke } from '../types'
import { extractJokeFromEvent, getIdFromEvent } from '../utils/events'
import { log, logError } from '../utils/logging'

const getResponse = (index: number): Promise<{ statusCode: number }> =>
  getDataByIndex(index)
    .then(() => status.OK)
    .catch(() => status.CREATED)

const setJoke = async (index: number, joke: Joke): Promise<APIGatewayProxyResult> => {
  const response = await getResponse(index)
  try {
    await setDataByIndex(index, joke)
    return { ...response, body: JSON.stringify(joke) }
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
    return setJoke(index, joke)
  } catch (error) {
    return { ...status.BAD_REQUEST, body: JSON.stringify({ message: error }) }
  }
}