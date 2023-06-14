import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from '../types'
import { extractRequestError, log, logError } from '../utils/logging'
import { getHighestIndex, setDataByIndex, setHighestIndex } from '../services/dynamodb'
import { apiUrl } from '../config'
import { extractJokeFromEvent } from '../utils/events'
import status from '../utils/status'

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
  } catch (error: any) {
    return { ...status.BAD_REQUEST, body: JSON.stringify(extractRequestError(error.message)) }
  }
}
