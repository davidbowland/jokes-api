import { APIGatewayProxyEvent, APIGatewayProxyEventQueryStringParameters } from 'aws-lambda'

import { corsMethods, corsOrigins, defaultOrigin } from './config'
import { handleErrorWithDefault } from './error-handling'

// CORS

export interface Payload {
  [key: string]: string
}

export interface Options {
  [key: string]: number
}

/* Headers */

const getReferrerOriginFromEvent = (event: APIGatewayProxyEvent): string =>
  event.headers?.Origin ?? new URL(event.headers?.Referer ?? '').origin

export const getReferrerOrigin = (event: APIGatewayProxyEvent): Promise<string> =>
  Promise.resolve(event).then(getReferrerOriginFromEvent).catch(handleErrorWithDefault(''))

const getMethodsFromEvent = (event: APIGatewayProxyEvent): string => corsMethods[event.resource] ?? 'OPTIONS'

const getMethods = (event: APIGatewayProxyEvent): Promise<string> => Promise.resolve(event).then(getMethodsFromEvent)

const getHeadersFromOriginAndMethods = (origin: string, methods: string): Payload => ({
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Origin': corsOrigins.includes(origin) ? origin : defaultOrigin,
  'Access-Control-Allow-Methods': methods,
})

export const getCorsHeadersFromEvent = (event: APIGatewayProxyEvent): Promise<Payload> =>
  Promise.all([getReferrerOrigin(event), getMethods(event)]).then(([origin, methods]) =>
    getHeadersFromOriginAndMethods(origin, methods)
  )

/* Body */

const parseEventBody = (event: APIGatewayProxyEvent): Payload =>
  JSON.parse(
    event.isBase64Encoded && event.body ? Buffer.from(event.body, 'base64').toString('utf8') : (event.body as string)
  )

export const getPayloadFromEvent = (event: APIGatewayProxyEvent): Promise<Payload> =>
  Promise.resolve(event).then(parseEventBody).catch(handleErrorWithDefault({}))

/* Query string parameters */

const parseIntegerParameterByName =
  (parameterName: string) => (availableParameters: APIGatewayProxyEventQueryStringParameters) =>
    parseInt(availableParameters[parameterName] as string, 10)

const applyQueryParameterDefault = (options?: Options) => (value: number | undefined) =>
  isNaN(value as number) ? options?.default : value

export const getIntFromParameter = (
  event: APIGatewayProxyEvent,
  parameterName: string,
  options?: Options
): Promise<number | undefined> =>
  Promise.resolve(event.queryStringParameters ?? {})
    .then(parseIntegerParameterByName(parameterName))
    .then(applyQueryParameterDefault(options))

const getParameterListByName =
  (parameterName: string) => (availableParameters: APIGatewayProxyEventQueryStringParameters) =>
    availableParameters[parameterName]?.split(',') ?? []

export const getListFromParameter = (event: APIGatewayProxyEvent, parameterName: string): Promise<string[]> =>
  Promise.resolve(event.queryStringParameters ?? {}).then(getParameterListByName(parameterName))
