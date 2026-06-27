import { pollyAudioVersion } from '../config'
import { getJokeById } from '../services/dynamodb'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Joke } from '../types'
import { getIdFromEvent } from '../utils/events'
import { log } from '../utils/logging'
import status from '../utils/status'

const fetchById = async (id: string): Promise<APIGatewayProxyResultV2<unknown>> => {
  try {
    const data: Joke = await getJokeById(id)
    const { version: _, ...jokeData } = data
    return {
      ...status.OK,
      body: JSON.stringify({
        ...jokeData,
        audio: data.audio?.version === pollyAudioVersion ? data.audio : undefined,
        id,
      }),
    }
  } catch (error) {
    return status.NOT_FOUND
  }
}

export const getByIdHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2<unknown>> => {
  log('Received event', { ...event, body: undefined })
  try {
    const id = getIdFromEvent(event)
    const result = await fetchById(id)
    return result
  } catch (error: unknown) {
    return { ...status.BAD_REQUEST, body: JSON.stringify({ message: (error as Error).message }) }
  }
}
