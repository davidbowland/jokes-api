import { fetchCountMaximum, jokeTableReferenceIndex } from './config'
import { getDataByIndex, getDataByIndexBatch, Joke, JokeBatch, ReferenceInfo, setDataByIndex } from './dynamodb'
import { getIntFromParameter, getPayloadFromEvent } from './event-processing'
import { APIGatewayEvent, APIGatewayEventHander, APIGatewayEventResult } from './index'
import status from './status'

// /v1/jokes

export const getPlain = async (
  referenceInfo: ReferenceInfo,
  offset: number,
  limit: number
): Promise<APIGatewayEventResult> => {
  if (offset > referenceInfo.count) {
    return status.NOT_FOUND
  } else if (limit < 1 || offset < 0 || offset == jokeTableReferenceIndex) {
    return status.BAD_REQUEST
  }

  const fetchCount = Math.min(limit, fetchCountMaximum, referenceInfo.count - offset + 1)
  const indexes = Array.from({ length: fetchCount }).map((_, index) => offset + index)
  const batchJokes: JokeBatch = await getDataByIndexBatch(indexes)

  return { ...status.OK, body: JSON.stringify(batchJokes) }
}

export const postPlain = async (referenceInfo: ReferenceInfo, jokeInfo: Joke): Promise<APIGatewayEventResult> => {
  if (!jokeInfo.joke) {
    return status.BAD_REQUEST
  }

  const newIndex = referenceInfo.count + 1
  await setDataByIndex(jokeTableReferenceIndex, { ...referenceInfo, count: newIndex })

  await setDataByIndex(newIndex, { joke: jokeInfo.joke })

  return { ...status.CREATED, body: JSON.stringify({ id: newIndex }) }
}

export const processPlain: APIGatewayEventHander = async (event: APIGatewayEvent): Promise<APIGatewayEventResult> => {
  const referenceInfo: ReferenceInfo = {
    count: 0,
    ...(await getDataByIndex(jokeTableReferenceIndex)),
  }

  switch (event.httpMethod) {
  case 'GET':
    return await exports.getPlain(
      referenceInfo,
        getIntFromParameter(event, 'offset', { default: 1 }) as number,
        getIntFromParameter(event, 'limit', { default: fetchCountMaximum }) as number
    )
  case 'POST':
    return await exports.postPlain(referenceInfo, getPayloadFromEvent(event))
  default:
    console.error(`processPlain received unexpected method ${event.httpMethod}`)
  }

  return status.BAD_REQUEST
}
