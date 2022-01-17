import { getDataByIndex } from '../services/dynamodb'
import { APIGatewayEvent, APIGatewayProxyResult, Joke } from '../types'
import { getIdFromEvent } from '../utils/events'
import { log } from '../utils/logging'
import status from '../utils/status'

const fetchById = async (index: number): Promise<APIGatewayProxyResult> => {
  try {
    const data = (await getDataByIndex(index)) as Joke
    return { ...status.OK, body: JSON.stringify({ ...data, index }) }
  } catch (error) {
    return status.NOT_FOUND
  }
}

export const getByIdHandler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  log('Received event', { ...event, body: undefined })
  try {
    const index = await getIdFromEvent(event)
    return await fetchById(index)
  } catch (error) {
    return { ...status.BAD_REQUEST, body: JSON.stringify({ message: error }) }
  }
}