import { getDataByIndex } from '../services/dynamodb'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Joke } from '../types'
import { getCorsHeaders, getIdFromEvent } from '../utils/events'
import { log } from '../utils/logging'
import status from '../utils/status'

const fetchById = async (index: number): Promise<APIGatewayProxyResultV2<any>> => {
  try {
    const data = (await getDataByIndex(index)) as Joke
    return { ...status.OK, body: JSON.stringify({ ...data, index }) }
  } catch (error) {
    return status.NOT_FOUND
  }
}

export const getByIdHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2<any>> => {
  log('Received event', { ...event, body: undefined })
  try {
    const index = await getIdFromEvent(event)
    const result = await fetchById(index)
    return { ...getCorsHeaders(event), ...result }
  } catch (error) {
    return { ...getCorsHeaders(event), ...status.BAD_REQUEST, body: JSON.stringify({ message: error }) }
  }
}
