import { fetchCountMaximum } from './config'
import { getDataByIndexBatch, ReferenceInfo } from './dynamodb'
import { handleErrorWithDefault } from './error-handling'
import { getIntFromParameter, getListFromParameter } from './event-processing'
import { APIGatewayEvent, APIGatewayEventResult, APIGatewayReferenceEventHander } from './index'
import status from './status'

export interface IndexList {
  avoids: string[]
  indexes: number[]
  maxIndex: number
}

// /v1/jokes/random

/* Get */

export const performIndexAvoid = (index: number, choiceCount: number, avoids: string[]): Promise<number> =>
  Promise.resolve(avoids.indexOf(`${index}`) + 1).then((avoidIndex) =>
    avoidIndex == 0 ? index : exports.performIndexAvoid(choiceCount + avoidIndex, choiceCount, avoids)
  )

export const getRandomIndex = (maxIndex: number, avoids: string[]): Promise<number> =>
  Promise.resolve(maxIndex - avoids.length).then((choiceCount) =>
    Promise.resolve(Math.floor(Math.random() * choiceCount + 1)).then((randomIndex) =>
      exports.performIndexAvoid(randomIndex, choiceCount, avoids)
    )
  )

const processBadFetchCount = (fetchCount: number): APIGatewayEventResult | undefined =>
  fetchCount < 1 ? status.BAD_REQUEST : undefined

const aggregateIndexList = ({ avoids, indexes, maxIndex }: IndexList): Promise<IndexList> =>
  exports.getRandomIndex(maxIndex, avoids).then((randomIndex: number) => ({
    avoids: avoids.length < maxIndex - 1 ? [...avoids, `${randomIndex}`] : [],
    indexes: [...indexes, randomIndex],
    maxIndex,
  }))

const getEmptyIndexList = (referenceInfo: ReferenceInfo, avoids: string[]): IndexList => ({
  avoids: avoids.length < referenceInfo.count ? avoids : [],
  indexes: [],
  maxIndex: referenceInfo.count,
})

const getIndexList = (referenceInfo: ReferenceInfo, avoids: string[], length: number): Promise<IndexList> =>
  Array.from({ length }).reduce(
    (lastPromise: Promise<IndexList>) => lastPromise.then(aggregateIndexList),
    Promise.resolve(getEmptyIndexList(referenceInfo, avoids))
  )

const processRandomFetch = (
  referenceInfo: ReferenceInfo,
  avoids: string[],
  fetchCount: number
): Promise<APIGatewayEventResult> =>
  Promise.resolve(getIndexList(referenceInfo, avoids, fetchCount))
    .then(({ indexes }) => getDataByIndexBatch(indexes))
    .then((batchJokes) => ({ ...status.OK, body: JSON.stringify(batchJokes) }))

export const getRandom = (
  referenceInfo: ReferenceInfo,
  count: number,
  avoids: string[]
): Promise<APIGatewayEventResult> =>
  Promise.resolve(Math.min(count, fetchCountMaximum, referenceInfo.count)).then((fetchCount) =>
    Promise.resolve(processBadFetchCount(fetchCount)).then(
      (response) => response ?? processRandomFetch(referenceInfo, avoids, fetchCount)
    )
  )

/* Processing */

const processGetWithParameters = (
  event: APIGatewayEvent,
  referenceInfo: ReferenceInfo
): Promise<APIGatewayEventResult | undefined> =>
  Promise.all([getIntFromParameter(event, 'count', { default: 1 }), getListFromParameter(event, 'avoid')]).then(
    ([count, avoid]) => exports.getRandom(referenceInfo, count, avoid)
  )

const processGet = (event: APIGatewayEvent, referenceInfo: ReferenceInfo): Promise<APIGatewayEventResult | undefined> =>
  event.httpMethod === 'GET' ? processGetWithParameters(event, referenceInfo) : Promise.resolve(undefined)

const processUnknownRequest = (event: APIGatewayEvent): APIGatewayEventResult =>
  handleErrorWithDefault(status.BAD_REQUEST)(new Error(`processRandom received unexpected method ${event.httpMethod}`))

export const processRandom: APIGatewayReferenceEventHander = (
  referenceInfo: ReferenceInfo,
  event: APIGatewayEvent
): Promise<APIGatewayEventResult> =>
  processGet(event, referenceInfo).then((response) => response ?? processUnknownRequest(event))
