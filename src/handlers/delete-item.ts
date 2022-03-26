import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Joke } from '../types'
import {
  deleteDataByIndex,
  getDataByIndex,
  getHighestIndex,
  setDataByIndex,
  setHighestIndex,
} from '../services/dynamodb'
import { log, logError } from '../utils/logging'
import { getIdFromEvent } from '../utils/events'
import status from '../utils/status'

const fetchDataThenDelete = async (index: number): Promise<APIGatewayProxyResultV2<any>> => {
  try {
    const data = (await getDataByIndex(index)) as Joke
    try {
      const highestIndex = await getHighestIndex()
      if (index > highestIndex) {
        return status.NO_CONTENT
      } else if (highestIndex !== index) {
        const highestData = await getDataByIndex(highestIndex)
        await setDataByIndex(index, highestData)
      }
      await deleteDataByIndex(highestIndex)
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

export const deleteByIdHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2<any>> => {
  log('Received event', { ...event, body: undefined })
  try {
    const index = getIdFromEvent(event)
    const result = await fetchDataThenDelete(index)
    return result
  } catch (error) {
    return { ...status.BAD_REQUEST, body: JSON.stringify({ message: error.message }) }
  }
}
