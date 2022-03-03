import { apiUrl } from '../config'
import { getHighestIndex, setDataByIndex, setHighestIndex } from '../services/dynamodb'
import status from '../utils/status'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from '../types'
import { extractJokeFromEvent } from '../utils/events'
import { log, logError } from '../utils/logging'

const getNextIndex = async (): Promise<number> => getHighestIndex().then((value) => value + 1)

export const postItemHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2<any>> => {
  log('Received event', { ...event, body: undefined })
  try {
    const joke = extractJokeFromEvent(event)
    try {
      const index = await getNextIndex()
      await setDataByIndex(index, joke)
      await setHighestIndex(index)
      return {
        ...status.CREATED,
        body: JSON.stringify({ ...joke, index }),
        headers: { Location: `${apiUrl}/${index}` },
      }
    } catch (error) {
      logError(error)
      return status.INTERNAL_SERVER_ERROR
    }
  } catch (error) {
    return { ...status.BAD_REQUEST, body: JSON.stringify({ message: error.message }) }
  }
}
