import { jokeTableReferenceIndex } from './config'
import { deleteDataByIndex, getDataByIndex, Joke, ReferenceInfo, setDataByIndex } from './dynamodb'
import { handleErrorWithDefault } from './error-handling'
import { getPayloadFromEvent } from './event-processing'
import { APIGatewayEvent, APIGatewayEventHander, APIGatewayEventResult } from './index'
import status from './status'

// /v1/jokes/{jokeId}

/* Get */

const extractJokeFromData = (jokeInfo: Joke | ReferenceInfo): APIGatewayEventResult =>
  (jokeInfo as Joke).joke === undefined ? status.NOT_FOUND : { ...status.OK, body: JSON.stringify(jokeInfo) }

export const getById = (requestJokeId: number): Promise<APIGatewayEventResult> =>
  getDataByIndex(requestJokeId).then(extractJokeFromData)

/* Put */

const putJokeFromData = (requestJokeId: number, jokeInfo: Joke): Promise<APIGatewayEventResult> =>
  setDataByIndex(requestJokeId, { joke: jokeInfo.joke }).then(() => status.NO_CONTENT)

export const putById = (requestJokeId: number, jokeInfo: Joke): Promise<APIGatewayEventResult> =>
  Promise.resolve(!jokeInfo.joke ? status.BAD_REQUEST : undefined).then(
    (response) => response ?? putJokeFromData(requestJokeId, jokeInfo)
  )

/* Delete */

const copyFinalJokeOverCurrentJoke = (requestJokeId: number, finalIndex: number): Promise<unknown> =>
  getDataByIndex(finalIndex).then((finalJoke) => setDataByIndex(requestJokeId, finalJoke))

const prepareToDeleteJoke = (requestJokeId: number, finalIndex: number): Promise<unknown> =>
  requestJokeId < finalIndex ? copyFinalJokeOverCurrentJoke(requestJokeId, finalIndex) : Promise.resolve(undefined)

const reduceReferenceInfoCount = (referenceInfo: ReferenceInfo, reduceBy: number): Promise<unknown> =>
  setDataByIndex(jokeTableReferenceIndex, {
    ...referenceInfo,
    count: Math.max(referenceInfo.count - reduceBy, 0),
  })

export const deleteById = (requestJokeId: number, referenceInfo: ReferenceInfo): Promise<APIGatewayEventResult> =>
  Promise.resolve(referenceInfo.count)
    .then((finalIndex) => prepareToDeleteJoke(requestJokeId, finalIndex).then(() => deleteDataByIndex(finalIndex)))
    .then(() => reduceReferenceInfoCount(referenceInfo, 1))
    .then(() => status.NO_CONTENT)

/* Processing */

const processBadId = (requestJokeId: number): APIGatewayEventResult | undefined =>
  isNaN(requestJokeId) || requestJokeId < 0 || requestJokeId == jokeTableReferenceIndex ? status.BAD_REQUEST : undefined

const processNotFoundId = (requestJokeId: number, referenceInfo: ReferenceInfo): APIGatewayEventResult | undefined =>
  requestJokeId > referenceInfo.count ? status.NOT_FOUND : undefined

const processGetById = (event: APIGatewayEvent, requestJokeId: number): Promise<APIGatewayEventResult | undefined> =>
  event.httpMethod === 'GET' ? exports.getById(requestJokeId) : Promise.resolve(undefined)

const processPutById = (event: APIGatewayEvent, requestJokeId: number): Promise<APIGatewayEventResult | undefined> =>
  event.httpMethod === 'PUT' ? exports.putById(requestJokeId, getPayloadFromEvent(event)) : Promise.resolve(undefined)

const processDeleteById = (
  event: APIGatewayEvent,
  requestJokeId: number,
  referenceInfo: ReferenceInfo
): Promise<APIGatewayEventResult | undefined> =>
  event.httpMethod === 'DELETE' ? exports.deleteById(requestJokeId, referenceInfo) : Promise.resolve(undefined)

const processUnknownRequest = (event: APIGatewayEvent): APIGatewayEventResult =>
  handleErrorWithDefault(status.BAD_REQUEST)(new Error(`processById received unexpected method ${event.httpMethod}`))

export const processById: APIGatewayEventHander = (
  referenceInfoPromise: Promise<ReferenceInfo>,
  event: APIGatewayEvent
): Promise<APIGatewayEventResult> =>
  referenceInfoPromise
    .then((referenceInfo) => ({ referenceInfo, requestJokeId: parseInt(event.pathParameters?.jokeId as string, 10) }))
    .then(({ referenceInfo, requestJokeId }) =>
      Promise.resolve(processBadId(requestJokeId))
        .then((response) => response ?? processNotFoundId(requestJokeId, referenceInfo))
        .then((response) => response ?? processGetById(event, requestJokeId))
        .then((response) => response ?? processPutById(event, requestJokeId))
        .then((response) => response ?? processDeleteById(event, requestJokeId, referenceInfo))
        .then((response) => response ?? processUnknownRequest(event))
    )
