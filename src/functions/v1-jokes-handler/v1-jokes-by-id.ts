import { jokeTableReferenceIndex } from './config'
import { deleteDataByIndex, getDataByIndex, Joke, ReferenceInfo, setDataByIndex } from './dynamodb'
import { getPayloadFromEvent } from './event-processing'
import { APIGatewayEvent, APIGatewayEventHander, APIGatewayEventResult } from './index'
import status from './status'

// /v1/jokes/{jokeId}

export const getById = async (requestJokeId: number): Promise<APIGatewayEventResult> => {
  const jokeInfo = (await getDataByIndex(requestJokeId)) as Joke
  if (jokeInfo.joke === undefined) {
    return status.NOT_FOUND
  }

  return { ...status.OK, body: JSON.stringify(jokeInfo) }
}

export const putById = async (requestJokeId: number, jokeInfo: Joke): Promise<APIGatewayEventResult> => {
  if (!jokeInfo.joke) {
    return status.BAD_REQUEST
  }
  await setDataByIndex(requestJokeId, { joke: jokeInfo.joke })
  return status.NO_CONTENT
}

export const deleteById = async (
  requestJokeId: number,
  referenceInfo: ReferenceInfo
): Promise<APIGatewayEventResult> => {
  const finalIndex = referenceInfo.count
  if (requestJokeId < finalIndex) {
    const finalJoke = await getDataByIndex(finalIndex)
    await setDataByIndex(requestJokeId, finalJoke)
  }
  await deleteDataByIndex(finalIndex)

  await setDataByIndex(jokeTableReferenceIndex, {
    ...referenceInfo,
    count: Math.max(finalIndex - 1, 0),
  })
  return status.NO_CONTENT
}

export const processById: APIGatewayEventHander = async (event: APIGatewayEvent): Promise<APIGatewayEventResult> => {
  const requestJokeId = parseInt(event.pathParameters?.jokeId as string, 10)
  if (isNaN(requestJokeId) || requestJokeId < 0 || requestJokeId == jokeTableReferenceIndex) {
    return status.BAD_REQUEST
  }

  const referenceInfo: ReferenceInfo = {
    count: 0,
    ...(await getDataByIndex(jokeTableReferenceIndex)),
  }
  if (requestJokeId > referenceInfo.count) {
    return status.NOT_FOUND
  }

  switch (event.httpMethod) {
  case 'GET':
    return await exports.getById(requestJokeId)
  case 'PUT':
    return await exports.putById(requestJokeId, getPayloadFromEvent(event))
  case 'DELETE':
    return await exports.deleteById(requestJokeId, referenceInfo)
  default:
    console.error(`processById received unexpected method ${event.httpMethod}`)
  }

  return status.BAD_REQUEST
}
