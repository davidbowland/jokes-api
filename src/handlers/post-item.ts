import { apiUrl } from '../config'
import { getHighestIndex, setJokeByIndex, setHighestIndex } from '../services/dynamodb'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from '../types'
import { extractJokeFromEvent } from '../utils/events'
import { extractRequestError, log, logError } from '../utils/logging'
import status from '../utils/status'

const getNextIndex = async (): Promise<number> => getHighestIndex().then((value) => value + 1)

export const postItemHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2<unknown>> => {
  log('Received event', { ...event, body: undefined })
  try {
    const joke = extractJokeFromEvent(event)
    try {
      const index = await getNextIndex()
      await setJokeByIndex(index, joke)
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
  } catch (error: unknown) {
    return { ...status.BAD_REQUEST, body: JSON.stringify(extractRequestError((error as Error).message)) }
  }
}
