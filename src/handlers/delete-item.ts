import { ConditionalCheckFailedException, deleteJoke, getJokeById, removeFromRoster } from '../services/dynamodb'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Joke } from '../types'
import { getIdFromEvent } from '../utils/events'
import { log, logError } from '../utils/logging'
import status from '../utils/status'

const MAX_ROSTER_RETRIES = 3

const fetchDataThenDelete = async (id: string): Promise<APIGatewayProxyResultV2<unknown>> => {
  try {
    const data: Joke = await getJokeById(id)
    try {
      await deleteJoke(id)
      for (let attempt = 0; attempt < MAX_ROSTER_RETRIES; attempt++) {
        try {
          await removeFromRoster(id)
          break
        } catch (error) {
          if (error instanceof ConditionalCheckFailedException && attempt < MAX_ROSTER_RETRIES - 1) {
            continue
          }
          throw error
        }
      }
      return { ...status.OK, body: JSON.stringify(data) }
    } catch (error) {
      logError(error)
      return status.INTERNAL_SERVER_ERROR
    }
  } catch (error) {
    return status.NO_CONTENT
  }
}

export const deleteByIdHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2<unknown>> => {
  log('Received event', { ...event, body: undefined })
  try {
    const id = getIdFromEvent(event)
    const result = await fetchDataThenDelete(id)
    return result
  } catch (error: unknown) {
    return { ...status.BAD_REQUEST, body: JSON.stringify({ message: (error as Error).message }) }
  }
}
