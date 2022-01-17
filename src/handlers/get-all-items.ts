import { scanData } from '../services/dynamodb'
import { APIGatewayEvent, APIGatewayProxyResult } from '../types'
import { getCorsHeaders } from '../utils/events'
import { log, logError } from '../utils/logging'
import status from '../utils/status'

export const getAllItemsHandler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  log('Received event', event)
  try {
    const data = await scanData()
    return { ...getCorsHeaders(event), ...status.OK, body: JSON.stringify(data) }
  } catch (error) {
    logError(error)
    return { ...getCorsHeaders(event), ...status.INTERNAL_SERVER_ERROR }
  }
}
