import { getRoster } from '../services/dynamodb'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from '../types'
import { log, logError } from '../utils/logging'
import status from '../utils/status'

export const getCountHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2<unknown>> => {
  log('Received event', { ...event, body: undefined })
  try {
    const roster = await getRoster()
    return { ...status.OK, body: JSON.stringify({ count: roster.length }) }
  } catch (error) {
    logError(error)
    return status.INTERNAL_SERVER_ERROR
  }
}
