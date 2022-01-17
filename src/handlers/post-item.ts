import { apiUrl } from '../config'
import { getHighestIndex, setDataByIndex, setHighestIndex } from '../services/dynamodb'
import status from '../utils/status'
import { APIGatewayEvent, APIGatewayProxyResult } from '../types'
import { extractJokeFromEvent, getCorsHeaders } from '../utils/events'
import { log, logError } from '../utils/logging'

const getNextIndex = async (): Promise<number> => getHighestIndex().then((value) => value + 1)

export const postItemHandler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  log('Received event', { ...event, body: undefined })
  try {
    const joke = await extractJokeFromEvent(event)
    try {
      const index = await getNextIndex()
      await setDataByIndex(index, joke)
      await setHighestIndex(index)
      return {
        ...status.CREATED,
        body: JSON.stringify({ ...joke, index }),
        headers: { ...getCorsHeaders(event).headers, Location: `${apiUrl}/${index}` },
      }
    } catch (error) {
      logError(error)
      return { ...getCorsHeaders(event), ...status.INTERNAL_SERVER_ERROR }
    }
  } catch (error) {
    return { ...getCorsHeaders(event), ...status.BAD_REQUEST, body: JSON.stringify({ message: error }) }
  }
}
