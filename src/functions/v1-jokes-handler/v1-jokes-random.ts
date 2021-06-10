import { fetchCountMaximum, jokeTableReferenceIndex } from './config'
import { getDataByIndex, getDataByIndexBatch, JokeBatch, ReferenceInfo } from './dynamodb'
import { getIntFromParameter, getListFromParameter } from './event-processing'
import { APIGatewayEvent, APIGatewayEventHander, APIGatewayEventResult } from './index'
import status from './status'

// /v1/jokes/random

const performIndexAvoid = (index: number, choiceCount: number, avoids: string[]): number => {
  const avoidIndex = avoids.indexOf(`${index}`) + 1
  return avoidIndex == 0 ? index : performIndexAvoid(choiceCount + avoidIndex, choiceCount, avoids)
}

const getRandomIndex = (maxIndex: number, avoids: string[]): number => {
  const choiceCount = maxIndex - avoids.length
  const randomIndex = Math.floor(Math.random() * choiceCount + 1)

  return performIndexAvoid(randomIndex, choiceCount, avoids)
}

const getRandom = async (
  referenceInfo: ReferenceInfo,
  count: number,
  avoids: string[]
): Promise<APIGatewayEventResult> => {
  if (count < 1 || count > referenceInfo.count) {
    return status.BAD_REQUEST
  }

  const fetchCount = Math.min(count, fetchCountMaximum, referenceInfo.count)
  const { indexes } = Array.from({ length: fetchCount }).reduce(
    ({ avoids, indexes, maxIndex }) => {
      const randomIndex = getRandomIndex(maxIndex, avoids)
      return {
        avoids: avoids.length < maxIndex - 1 ? avoids + [`${randomIndex}`] : [],
        indexes: indexes.concat([randomIndex]),
        maxIndex,
      }
    },
    {
      avoids: avoids.length < referenceInfo.count ? avoids : [],
      indexes: [],
      maxIndex: referenceInfo.count,
    }
  )
  const batchJokes: JokeBatch = await getDataByIndexBatch(indexes)

  return { ...status.OK, body: JSON.stringify(batchJokes) }
}

export const processRandom: APIGatewayEventHander = async (
  event: APIGatewayEvent
): Promise<APIGatewayEventResult> => {
  const referenceInfo: ReferenceInfo = {
    count: 0,
    ...(await getDataByIndex(jokeTableReferenceIndex)),
  }

  switch (event.httpMethod) {
  case 'GET':
    return await getRandom(
      referenceInfo,
        getIntFromParameter(event, 'count', { default: 1 }) as number,
        getListFromParameter(event, 'avoid')
    )
  default:
    console.error(`processRandom received unexpected method ${event.httpMethod}`)
  }

  return status.BAD_REQUEST
}
