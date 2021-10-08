import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { jokeTableReferenceIndex, resourceByID, resourcePlain, resourceRandom } from './config'
import { getDataByIndex, ReferenceInfo } from './dynamodb'
import { handleErrorWithDefault } from './error-handling'
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
  (referenceInfoPromise: Promise<ReferenceInfo>, event: APIGatewayEvent): Promise<APIGatewayEventResult>
}

const getReferenceInfo = (): Promise<ReferenceInfo> =>
  getDataByIndex(jokeTableReferenceIndex).then((referenceInfo) => ({
    count: 0,
    ...referenceInfo,
  }))

const processOptionsRequest = (event: APIGatewayEvent): APIGatewayEventResult | undefined =>
  event.httpMethod == 'OPTIONS' ? status.OK : undefined

const processIdRequest = (
  referenceInfo: Promise<ReferenceInfo>,
  event: APIGatewayEvent
): Promise<APIGatewayEventResult | undefined> =>
  event.resource == resourceByID ? processById(referenceInfo, event) : Promise.resolve(undefined)

const processPlainRequest = (
  referenceInfo: Promise<ReferenceInfo>,
  event: APIGatewayEvent
): Promise<APIGatewayEventResult | undefined> =>
  event.resource == resourcePlain ? processPlain(referenceInfo, event) : Promise.resolve(undefined)

const processRandomRequest = (
  referenceInfo: Promise<ReferenceInfo>,
  event: APIGatewayEvent
): Promise<APIGatewayEventResult | undefined> =>
  event.resource == resourceRandom ? processRandom(referenceInfo, event) : Promise.resolve(undefined)

const processUnknownRequest = (event: APIGatewayEvent): APIGatewayEventResult =>
  handleErrorWithDefault(status.BAD_REQUEST)(new Error(`handler received unexpected resource ${event.resource}`))

export const processRequest: APIGatewayEventHander = async (event: APIGatewayEvent): Promise<APIGatewayEventResult> =>
  Promise.resolve(processOptionsRequest(event))
    .then((response) => response ?? processIdRequest(getReferenceInfo(), event))
    .then((response) => response ?? processPlainRequest(getReferenceInfo(), event))
    .then((response) => response ?? processRandomRequest(getReferenceInfo(), event))
    .then((response) => response ?? processUnknownRequest(event))
    .catch(handleErrorWithDefault(status.INTERNAL_SERVER_ERROR))

export const handler: APIGatewayEventHander = (event: APIGatewayEvent): Promise<APIGatewayEventResult> =>
  Promise.all([getCorsHeadersFromEvent(event), exports.processRequest(event)])
    .then(([corsHeaders, result]) => ({ headers: corsHeaders, ...result }))
    .catch(handleErrorWithDefault(status.INTERNAL_SERVER_ERROR))
