import { randomInt } from 'crypto'

import { randomCountMaximum } from '../config'
import { getDataByIndex, getHighestIndex } from '../services/dynamodb'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Joke, JokeBatch } from '../types'
import { log, logError } from '../utils/logging'
import status from '../utils/status'

const getRandomJoke = async (indexList: number[], count: number): Promise<JokeBatch[]> => {
  const index = indexList[randomInt(indexList.length)]
  const joke = (await getDataByIndex(index)) as Joke
  const filteredList = indexList.filter((value) => value !== index)
  return count > 0 && filteredList.length
    ? [...(await getRandomJoke(filteredList, count - 1)), { data: joke, id: index }]
    : [{ data: joke, id: index }]
}

export const getRandomHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2<any>> => {
  log('Received event', { ...event, body: undefined })
  const count =
    Math.max(Math.min(parseInt(event.queryStringParameters?.count as string, 10), randomCountMaximum), 1) ||
    randomCountMaximum
  const filterList = (event.queryStringParameters?.avoid?.split(',') ?? [])
    .map((value) => parseInt(value, 10))
    .slice(0, count)

  try {
    const highestIndex = await getHighestIndex()
    if (highestIndex === 0) {
      return status.NOT_FOUND
    }
    const indexList = Array.from({ length: highestIndex })
      .map((_, index) => index + 1)
      .filter((index) => filterList.every((avoid) => avoid !== index))
    const jokeList = await getRandomJoke(indexList, count - 1)
    return { ...status.OK, body: JSON.stringify(jokeList) }
  } catch (error) {
    logError(error)
    return status.INTERNAL_SERVER_ERROR
  }
}
