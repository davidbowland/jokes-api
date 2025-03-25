import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Joke } from '../types'
import { getDataByIndex, setDataByIndex } from '../services/dynamodb'
import { log, logError } from '../utils/logging'
import { getIdFromEvent } from '../utils/events'
import { pollyAudioVersion } from '../config'
import status from '../utils/status'
import { synthesizeSpeech } from '../services/polly'

const synthesize = async (index: number, joke: Joke): Promise<Joke | undefined> => {
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
    await setDataByIndex(index, jokeWithAudio)
    return jokeWithAudio
  } catch (error) {
    logError(error)
    return undefined
  }
}

const fetchById = async (index: number): Promise<APIGatewayProxyResultV2<any>> => {
  try {
    const joke = (await getDataByIndex(index)) as Joke
    const jokeWithAudio = await synthesize(index, joke)
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

export const getByIdHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2<any>> => {
  log('Received event', { ...event, body: undefined })
  try {
    const index = getIdFromEvent(event)
    if (index < 1) {
      return status.NOT_FOUND
    }

    const result = await fetchById(index)
    return result
  } catch (error: any) {
    return { ...status.BAD_REQUEST, body: JSON.stringify({ message: error.message }) }
  }
}
