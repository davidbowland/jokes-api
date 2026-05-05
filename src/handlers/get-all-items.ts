import { scanJokes } from '../services/dynamodb'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from '../types'
import { log, logError } from '../utils/logging'
import status from '../utils/status'

export const getAllItemsHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2<unknown>> => {
  log('Received event', event)
  try {
    const data = await scanJokes()
    const response = data.map(({ data: { version: _, ...joke }, id }) => ({ data: joke, id }))
    return { ...status.OK, body: JSON.stringify(response) }
  } catch (error) {
    logError(error)
    return status.INTERNAL_SERVER_ERROR
  }
}
