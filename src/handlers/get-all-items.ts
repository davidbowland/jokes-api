import { scanData } from '../services/dynamodb'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from '../types'
import { getCorsHeaders } from '../utils/events'
import { log, logError } from '../utils/logging'
import status from '../utils/status'

export const getAllItemsHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2<any>> => {
  log('Received event', event)
  try {
    const data = await scanData()
    return { ...getCorsHeaders(event), ...status.OK, body: JSON.stringify(data) }
  } catch (error) {
    logError(error)
    return { ...getCorsHeaders(event), ...status.INTERNAL_SERVER_ERROR }
  }
}
