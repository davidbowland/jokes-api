import { randomCountMaximum } from '../config'
import { getDataByIndex, getHighestIndex } from '../services/dynamodb'
import { APIGatewayEvent, APIGatewayProxyResult, Joke, JokeBatch } from '../types'
import { log, logError } from '../utils/logging'
import status from '../utils/status'

const getRandomJoke = async (indexList: number[], count: number): Promise<JokeBatch> => {
  const index = indexList[Math.round(Math.random() * indexList.length)]
  const joke = (await getDataByIndex(index)) as Joke
  const filteredList = indexList.filter((value) => value !== index)
  return count > 0 && filteredList.length
    ? { [index]: joke, ...(await getRandomJoke(filteredList, count - 1)) }
    : { [index]: joke }
}

export const getRandomHandler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  log('Received event', { ...event, body: undefined })
  const count =
    Math.max(Math.min(parseInt(event.queryStringParameters?.count, 10), randomCountMaximum), 1) || randomCountMaximum
  const filterList = (event.queryStringParameters?.avoid?.split(',') ?? []).map((value) => parseInt(value, 10))

  try {
    const highestIndex = await getHighestIndex()
    try {
      const indexList = Array.from({ length: highestIndex })
        .map((_, index) => index)
        .filter((index) => filterList.every((avoid) => avoid !== index))
      const jokeList = await getRandomJoke(indexList, count - 1)
      return { ...status.OK, body: JSON.stringify(jokeList) }
    } catch (error) {
      logError(error)
      return status.INTERNAL_SERVER_ERROR
    }
  } catch {
    return status.NOT_FOUND
  }
}