import { pollyAudioVersion } from '../config'
import { getJokeById, updateJoke } from '../services/dynamodb'
import { synthesizeSpeech } from '../services/polly'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Joke } from '../types'
import { getIdFromEvent } from '../utils/events'
import { log, logError } from '../utils/logging'
import status from '../utils/status'

const synthesize = async (id: string, joke: Joke): Promise<Joke | undefined> => {
  if (joke.audio?.version === pollyAudioVersion) {
    return joke
  }

  try {
    const { base64, contentType, version } = await synthesizeSpeech(joke)
    const jokeWithAudio: Joke = {
      ...joke,
      audio: {
        base64,
        contentType,
        version,
      },
    }
    try {
      await updateJoke(id, jokeWithAudio, joke.version)
    } catch {
      // Version conflict means another request already updated — safe to ignore
    }
    return jokeWithAudio
  } catch (error) {
    logError(error)
    return undefined
  }
}

const fetchById = async (id: string): Promise<APIGatewayProxyResultV2<unknown>> => {
  try {
    const joke: Joke = await getJokeById(id)
    const jokeWithAudio = await synthesize(id, joke)
    if (jokeWithAudio === undefined) {
      return status.INTERNAL_SERVER_ERROR
    }
    return {
      ...status.OK,
      body: jokeWithAudio.audio?.base64,
      headers: { 'content-type': jokeWithAudio.audio?.contentType },
      isBase64Encoded: true,
    }
  } catch (error) {
    return status.NOT_FOUND
  }
}

export const getByIdHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2<unknown>> => {
  log('Received event', { ...event, body: undefined })
  try {
    const id = getIdFromEvent(event)
    const result = await fetchById(id)
    return result
  } catch (error: unknown) {
    return { ...status.BAD_REQUEST, body: JSON.stringify({ message: (error as Error).message }) }
  }
}
