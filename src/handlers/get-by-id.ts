import { pollyAudioVersion } from '../config'
import { getDataByIndex } from '../services/dynamodb'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Joke } from '../types'
import { getIdFromEvent } from '../utils/events'
import { log } from '../utils/logging'
import status from '../utils/status'

const fetchById = async (index: number): Promise<APIGatewayProxyResultV2<any>> => {
  try {
    const data = (await getDataByIndex(index)) as Joke
    return {
      ...status.OK,
      body: JSON.stringify({
        ...data,
        audio: data.audio?.version === pollyAudioVersion ? data.audio : undefined,
        index,
      }),
    }
  } catch (error) {
    return status.NOT_FOUND
  }
}

export const getByIdHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2<any>> => {
  log('Received event', { ...event, body: undefined })
  try {
    const index = getIdFromEvent(event)
    if (index < 1) {
      return status.NOT_FOUND
    }

    const result = await fetchById(index)
    return result
  } catch (error: any) {
    return { ...status.BAD_REQUEST, body: JSON.stringify({ message: error.message }) }
  }
}
