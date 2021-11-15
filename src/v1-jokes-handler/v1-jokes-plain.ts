import { apiUrl, fetchCountMaximum, jokeTableReferenceIndex, resourcePlain } from './config'
import { getDataByIndexBatch, Joke, ReferenceInfo, setDataByIndex } from './dynamodb'
import { handleErrorWithDefault } from './error-handling'
import { getIntFromParameter, getPayloadFromEvent } from './event-processing'
import { APIGatewayEvent, APIGatewayEventResult, APIGatewayReferenceEventHander } from './index'
import status from './status'

// /v1/jokes

/* Get */

const processTooHighOffset = (referenceInfo: ReferenceInfo, offset: number): APIGatewayEventResult | undefined =>
  offset > referenceInfo.count ? status.NOT_FOUND : undefined

const processLimitOffsetValid = (offset: number, limit: number): APIGatewayEventResult | undefined =>
  limit < 1 || offset < 0 || offset == jokeTableReferenceIndex ? status.BAD_REQUEST : undefined

const getMaxFetchCount = (referenceInfo: ReferenceInfo, offset: number, limit: number): number =>
  Math.min(limit, fetchCountMaximum, referenceInfo.count - offset + 1)

const generateBatchIndexes = (offset: number, length: number): number[] =>
  length === 1 ? [offset] : [offset, ...generateBatchIndexes(offset + 1, length - 1)]

const generateBatchResponse = (
  referenceInfo: ReferenceInfo,
  offset: number,
  limit: number
): Promise<APIGatewayEventResult> =>
  Promise.resolve(getMaxFetchCount(referenceInfo, offset, limit))
    .then((fetchCount) => generateBatchIndexes(offset, fetchCount))
    .then(getDataByIndexBatch)
    .then((batchJokes) => ({ ...status.OK, body: JSON.stringify(batchJokes) }))

export const getPlain = (referenceInfo: ReferenceInfo, offset: number, limit: number): Promise<APIGatewayEventResult> =>
  Promise.resolve(processTooHighOffset(referenceInfo, offset))
    .then((response) => response ?? processLimitOffsetValid(offset, limit))
    .then((response) => response ?? generateBatchResponse(referenceInfo, offset, limit))

/* Post */

const incrementReferenceCount = (referenceInfo: ReferenceInfo): ReferenceInfo => ({
  ...referenceInfo,
  count: referenceInfo.count + 1,
})

const processNoJoke = (jokeInfo: Joke): APIGatewayEventResult | undefined =>
  !jokeInfo.joke ? status.BAD_REQUEST : undefined

const processPostJoke = (referenceInfo: ReferenceInfo, jokeInfo: Joke): Promise<APIGatewayEventResult> =>
  Promise.resolve(incrementReferenceCount(referenceInfo)).then((newReferenceInfo) =>
    setDataByIndex(jokeTableReferenceIndex, newReferenceInfo)
      .then(() => setDataByIndex(newReferenceInfo.count, { joke: jokeInfo.joke }))
      .then(() => ({
        ...status.CREATED,
        body: JSON.stringify({ id: newReferenceInfo.count }),
        headers: { Location: `${apiUrl}${resourcePlain.replace(/^\//, '')}/${newReferenceInfo.count}` },
      }))
  )

export const postPlain = (referenceInfo: ReferenceInfo, jokeInfo: Joke): Promise<APIGatewayEventResult> =>
  Promise.resolve(processNoJoke(jokeInfo)).then((response) => response ?? processPostJoke(referenceInfo, jokeInfo))

/* Processing */

const processGetParameters = (referenceInfo: ReferenceInfo, event: APIGatewayEvent): Promise<APIGatewayEventResult> =>
  Promise.all([
    getIntFromParameter(event, 'offset', { default: 1 }),
    getIntFromParameter(event, 'limit', { default: fetchCountMaximum }),
  ]).then(([offset, limit]) => exports.getPlain(referenceInfo, offset, limit))

const processGet = (referenceInfo: ReferenceInfo, event: APIGatewayEvent): Promise<APIGatewayEventResult | undefined> =>
  event.httpMethod === 'GET' ? processGetParameters(referenceInfo, event) : Promise.resolve(undefined)

const processPostPayload = (referenceInfo: ReferenceInfo, event: APIGatewayEvent): Promise<APIGatewayEventResult> =>
  getPayloadFromEvent(event).then((payload) => exports.postPlain(referenceInfo, payload))

const processPost = (
  referenceInfo: ReferenceInfo,
  event: APIGatewayEvent
): Promise<APIGatewayEventResult | undefined> =>
  event.httpMethod === 'POST' ? processPostPayload(referenceInfo, event) : Promise.resolve(undefined)

const processUnknownRequest = (event: APIGatewayEvent): APIGatewayEventResult =>
  handleErrorWithDefault(status.BAD_REQUEST)(new Error(`processPlain received unexpected method ${event.httpMethod}`))

export const processPlain: APIGatewayReferenceEventHander = (
  referenceInfo: ReferenceInfo,
  event: APIGatewayEvent
): Promise<APIGatewayEventResult> =>
  processGet(referenceInfo, event)
    .then((response) => response ?? processPost(referenceInfo, event))
    .then((response) => response ?? processUnknownRequest(event))
