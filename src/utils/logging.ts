import AWSXRay from 'aws-xray-sdk-core'

import { APIGatewayProxyEventV2 } from '../types'

export const extractRequestError = (message: string): { errors?: Error; message?: string } => {
  try {
    return { errors: JSON.parse(message) }
  } catch (e: unknown) {
    return { message }
  }
}

export const log = (...args: unknown[]): unknown => console.log(...args)

export const logError = (...args: unknown[]): unknown => console.error(...args)

export const xrayCapture = (x: any) => (process.env.AWS_SAM_LOCAL === 'true' ? x : AWSXRay.captureAWSv3Client(x))

// x-api-key covers the REST API (Auth.ApiKeyRequired); authorization covers the HTTP API's Cognito JWT bearer token.
const REDACTED_HEADERS = new Set(['authorization', 'x-api-key'])

const redactHeaders = (headers: APIGatewayProxyEventV2['headers']): APIGatewayProxyEventV2['headers'] =>
  Object.fromEntries(Object.entries(headers ?? {}).filter(([key]) => !REDACTED_HEADERS.has(key.toLowerCase())))

const redactMultiValueHeaders = (
  multiValueHeaders: Record<string, string[]> | undefined,
): Record<string, string[]> | undefined =>
  multiValueHeaders &&
  Object.fromEntries(Object.entries(multiValueHeaders).filter(([key]) => !REDACTED_HEADERS.has(key.toLowerCase())))

const redactClaims = (claims: Record<string, unknown> | undefined): Record<string, unknown> | undefined =>
  claims && { sub: claims.sub }

// Only body/Authorization/x-api-key headers/JWT claims/the REST API key carry secrets or PII; everything
// else in the event (method, path, query params, request id, source IP) is safe and useful for debugging.
// Handlers are typed for APIGatewayProxyEventV2 (HTTP API), but this repo's template.yaml also fronts the
// same handlers with a REST API (Auth.ApiKeyRequired) which delivers V1-shaped events where the literal
// API key value is echoed back in requestContext.identity.apiKey -- redacted here too when present. REST
// (V1) events also always populate `multiValueHeaders`, duplicating `headers` -- redact it the same way or
// x-api-key/Authorization survive in CloudWatch via that field on every REST-authenticated call.
export const redactEvent = (event: APIGatewayProxyEventV2): unknown => {
  const requestContext = event.requestContext as unknown as {
    authorizer?: { jwt?: { claims?: Record<string, unknown> } }
    identity?: { apiKey?: string }
  }
  const { multiValueHeaders } = event as unknown as { multiValueHeaders?: Record<string, string[]> }
  return {
    ...event,
    body: undefined,
    headers: redactHeaders(event.headers),
    multiValueHeaders: redactMultiValueHeaders(multiValueHeaders),
    requestContext: {
      ...event.requestContext,
      authorizer: requestContext.authorizer && {
        jwt: { claims: redactClaims(requestContext.authorizer.jwt?.claims) },
      },
      identity: requestContext.identity && { ...requestContext.identity, apiKey: undefined },
    },
  }
}
