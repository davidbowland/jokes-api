import { apiUrl } from '../config'
import { addToRoster, ConditionalCheckFailedException, putJoke } from '../services/dynamodb'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from '../types'
import { extractJokeFromEvent } from '../utils/events'
import { generateId } from '../utils/id-generator'
import { extractRequestError, log, logError } from '../utils/logging'
import status from '../utils/status'

const MAX_ID_ATTEMPTS = 5

const createJoke = async (joke: ReturnType<typeof extractJokeFromEvent>): Promise<{ id: string }> => {
  for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt++) {
    const id = generateId()
    try {
      await putJoke(id, joke)
      return { id }
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        continue
      }
      throw error
    }
  }
  throw new Error(`Failed to generate unique ID after ${MAX_ID_ATTEMPTS} attempts`)
}

export const postItemHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2<unknown>> => {
  log('Received event', { ...event, body: undefined })
  try {
    const joke = extractJokeFromEvent(event)
    try {
      const { id } = await createJoke(joke)
      await addToRoster(id)
      const { version: _, ...jokeData } = joke
      return {
        ...status.CREATED,
        body: JSON.stringify({ ...jokeData, id }),
        headers: { Location: `${apiUrl}/${id}` },
      }
    } catch (error) {
      logError(error)
      return status.INTERNAL_SERVER_ERROR
    }
  } catch (error: unknown) {
    return { ...status.BAD_REQUEST, body: JSON.stringify(extractRequestError((error as Error).message)) }
  }
}
