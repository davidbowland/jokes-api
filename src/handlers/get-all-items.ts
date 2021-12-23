import { scanData } from '../services/dynamodb'
import { APIGatewayEvent, APIGatewayProxyResult } from '../types'
import { log, logError } from '../utils/logging'
import status from '../utils/status'

export const getAllItemsHandler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  log('Received event', event)
  try {
    const data = await scanData()
    return { ...status.OK, body: JSON.stringify(data) }
  } catch (error) {
    logError(error)
    return status.INTERNAL_SERVER_ERROR
  }
}
