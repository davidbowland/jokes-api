import {
  deleteJokeByIndex,
  getJokeByIndex,
  getHighestIndex,
  setJokeByIndex,
  setHighestIndex,
} from '../services/dynamodb'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Joke } from '../types'
import { getIdFromEvent } from '../utils/events'
import { log, logError } from '../utils/logging'
import status from '../utils/status'

const fetchDataThenDelete = async (index: number): Promise<APIGatewayProxyResultV2<unknown>> => {
  try {
    const data: Joke = await getJokeByIndex(index)
    try {
      const highestIndex = await getHighestIndex()
      if (index > highestIndex) {
        return status.NO_CONTENT
      } else if (highestIndex !== index) {
        const highestData = await getJokeByIndex(highestIndex)
        await setJokeByIndex(index, highestData)
      }
      await deleteJokeByIndex(highestIndex)
      await setHighestIndex(highestIndex - 1)
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
    const index = getIdFromEvent(event)
    if (index < 1) {
      return status.NOT_FOUND
    }

    const result = await fetchDataThenDelete(index)
    return result
  } catch (error: unknown) {
    return { ...status.BAD_REQUEST, body: JSON.stringify({ message: (error as Error).message }) }
  }
}
