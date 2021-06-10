import { APIGatewayProxyEvent } from 'aws-lambda'

import { corsMethods, corsOrigins, defaultOrigin } from './config'

// CORS

interface Payload {
  [key: string]: string
}

interface Options {
  [key: string]: number
}

export const getReferrerOriginFromEvent = (event: APIGatewayProxyEvent): string => {
  try {
    return event?.headers?.Origin ?? new URL(event?.headers?.Referer ?? '').origin
  } catch (error) {
    return ''
  }
}

export const getCorsHeadersFromEvent = (event: APIGatewayProxyEvent): Payload => {
  const origin = exports.getReferrerOriginFromEvent(event)
  const methods = corsMethods[event.resource] ?? 'OPTIONS'
  return {
    'Access-Control-Allow-Headers':
      'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Origin': corsOrigins.includes(origin) ? origin : defaultOrigin,
    'Access-Control-Allow-Methods': methods,
  }
}

// Body

export const getPayloadFromEvent = (event: APIGatewayProxyEvent): Payload => {
  try {
    return JSON.parse(
      event.isBase64Encoded
        ? Buffer.from(event.body as string, 'base64').toString('utf8')
        : (event.body as string)
    )
  } catch (error) {
    return {}
  }
}

// Query string parameters

export const getIntFromParameter = (
  event: APIGatewayProxyEvent,
  parameterName: string,
  options: Options
): number | undefined => {
  const availableParameters = event.queryStringParameters ?? {}
  const value = parseInt(availableParameters[parameterName] as string, 10)
  return isNaN(value) ? options?.default : value
}

export const getListFromParameter = (
  event: APIGatewayProxyEvent,
  parameterName: string
): string[] => {
  const availableParameters = event.queryStringParameters ?? {}
  return availableParameters[parameterName]?.split(',') ?? []
}
