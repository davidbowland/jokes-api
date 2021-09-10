import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { resourceByID, resourcePlain, resourceRandom } from './config'
import { getCorsHeadersFromEvent } from './event-processing'
import status from './status'
import { processById } from './v1-jokes-by-id'
import { processPlain } from './v1-jokes-plain'
import { processRandom } from './v1-jokes-random'

export type APIGatewayEvent = APIGatewayProxyEvent

export interface APIGatewayEventResult extends Omit<APIGatewayProxyResult, 'body'> {
  body?: string
}

export interface APIGatewayEventHander {
  (event: APIGatewayEvent): Promise<APIGatewayEventResult>
}

export const processRequest: APIGatewayEventHander = async (event: APIGatewayEvent): Promise<APIGatewayEventResult> => {
  try {
    if (event.httpMethod == 'OPTIONS') {
      return status.OK
    }
    switch (event.resource) {
    case resourceByID:
      return await processById(event)
    case resourcePlain:
      return await processPlain(event)
    case resourceRandom:
      return await processRandom(event)
    default:
      console.error(`handler received unexpected resource ${event.resource}`)
    }
    return status.BAD_REQUEST
  } catch (error) {
    console.error(error)
    return status.INTERNAL_SERVER_ERROR
  }
}

export const handler: APIGatewayEventHander = async (event: APIGatewayEvent): Promise<APIGatewayEventResult> => {
  try {
    const corsHeaders = getCorsHeadersFromEvent(event)
    const result: APIGatewayEventResult = await exports.processRequest(event)
    return { headers: corsHeaders, ...result }
  } catch (error) {
    console.error(error)
    return status.INTERNAL_SERVER_ERROR
  }
}
