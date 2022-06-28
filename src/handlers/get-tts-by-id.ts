import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Joke } from '../types'
import { log, logError } from '../utils/logging'
import { getDataByIndex } from '../services/dynamodb'
import { getIdFromEvent } from '../utils/events'
import status from '../utils/status'
import { synthesizeSpeech } from '../services/polly'

const synthesize = async (joke: Joke): Promise<APIGatewayProxyResultV2<any>> => {
  try {
    const speech = await synthesizeSpeech(joke)
    return {
      ...status.OK,
      body: speech.AudioStream.toString('base64'),
      headers: { 'content-type': speech.ContentType },
      isBase64Encoded: true,
    }
  } catch (error) {
    logError(error)
    return status.INTERNAL_SERVER_ERROR
  }
}

const fetchById = async (index: number): Promise<APIGatewayProxyResultV2<any>> => {
  try {
    const joke = (await getDataByIndex(index)) as Joke
    return synthesize(joke)
  } catch (error) {
    return status.NOT_FOUND
  }
}

export const getByIdHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2<any>> => {
  log('Received event', { ...event, body: undefined })
  try {
    const index = getIdFromEvent(event)
    const result = await fetchById(index)
    return result
  } catch (error) {
    return { ...status.BAD_REQUEST, body: JSON.stringify({ message: error.message }) }
  }
}
