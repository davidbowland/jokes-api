import { APIGatewayProxyEventV2 } from '@types'
import { extractRequestError, log, logError, redactEvent } from '@utils/logging'

describe('logging', () => {
  beforeAll(() => {
    console.error = jest.fn()
    console.log = jest.fn()
  })

  describe('extractRequestError', () => {
    test('expect JSON data is returned as an object', async () => {
      const data = { hello: 'world' }

      const output = extractRequestError(JSON.stringify(data))
      expect(output).toEqual({ errors: data })
    })

    test('expect non-JSON data is returned as a string', async () => {
      const data = 'fnord'

      const output = extractRequestError(data)
      expect(output).toEqual({ message: data })
    })
  })

  describe('log', () => {
    test.each(['Hello', 0, null, undefined, { a: 1, b: 2 }])(
      'expect logFunc to have been called with message',
      async (value) => {
        const message = `Log message for value ${JSON.stringify(value)}`
        await log(message)

        expect(console.log).toHaveBeenCalledWith(message)
      },
    )
  })

  describe('logError', () => {
    test.each(['Hello', 0, null, undefined, { a: 1, b: 2 }])(
      'expect logFunc to have been called with message',
      async (value) => {
        const message = `Error message for value ${JSON.stringify(value)}`
        const error = new Error(message)
        await logError(error)

        expect(console.error).toHaveBeenCalledWith(error)
      },
    )
  })

  describe('redactEvent', () => {
    const event = {
      body: JSON.stringify({ secret: 'sauce' }),
      headers: {
        authorization: 'Bearer secret-jwt',
        Authorization: 'Bearer secret-jwt',
        'content-type': 'json',
        'x-api-key': 'super-secret-key',
      },
      requestContext: {
        authorizer: { jwt: { claims: { name: 'Jane Doe', phone_number: '+15551234567', sub: 'user-1' } } },
        identity: { apiKey: 'super-secret-key', sourceIp: '1.2.3.4' },
      },
    } as unknown as APIGatewayProxyEventV2

    test('expect body to be dropped', () => {
      expect((redactEvent(event) as { body: unknown }).body).toBeUndefined()
    })

    test('expect authorization and x-api-key headers to be dropped (any casing) while other headers remain', () => {
      const result = redactEvent(event) as { headers: Record<string, string> }

      expect(result.headers.authorization).toBeUndefined()
      expect(result.headers.Authorization).toBeUndefined()
      expect(result.headers['x-api-key']).toBeUndefined()
      expect(result.headers['content-type']).toBe('json')
    })

    test('expect only sub to remain in jwt claims, dropping phone/name PII', () => {
      const result = redactEvent(event) as { requestContext: { authorizer: { jwt: { claims: unknown } } } }

      expect(result.requestContext.authorizer.jwt.claims).toEqual({ sub: 'user-1' })
    })

    test('expect the REST API key value to be dropped from requestContext.identity while other identity fields remain', () => {
      const result = redactEvent(event) as { requestContext: { identity: { apiKey: unknown; sourceIp: unknown } } }

      expect(result.requestContext.identity.apiKey).toBeUndefined()
      expect(result.requestContext.identity.sourceIp).toBe('1.2.3.4')
    })

    test('expect events without an authorizer or identity to pass through unchanged', () => {
      const unauthenticated = { headers: {}, requestContext: {} } as unknown as APIGatewayProxyEventV2
      const result = redactEvent(unauthenticated) as { requestContext: { authorizer: unknown; identity: unknown } }

      expect(result.requestContext.authorizer).toBeUndefined()
      expect(result.requestContext.identity).toBeUndefined()
    })

    // Realistic API Gateway REST (Lambda-proxy v1) event: v1 events always populate multiValueHeaders
    // alongside headers, duplicating every header (including Authorization/x-api-key) into a second field.
    const v1RestEvent = {
      body: JSON.stringify({ secret: 'sauce' }),
      headers: {
        Authorization: 'Bearer secret-jwt',
        'Content-Type': 'json',
        'X-Api-Key': 'super-secret-key',
      },
      multiValueHeaders: {
        Authorization: ['Bearer secret-jwt'],
        'Content-Type': ['json'],
        'X-Api-Key': ['super-secret-key'],
      },
      requestContext: {
        identity: { apiKey: 'super-secret-key', sourceIp: '5.6.7.8' },
      },
    } as unknown as APIGatewayProxyEventV2

    test('expect multiValueHeaders to have authorization and x-api-key redacted (any casing) while other headers remain', () => {
      const result = redactEvent(v1RestEvent) as { multiValueHeaders: Record<string, string[]> }

      expect(result.multiValueHeaders.Authorization).toBeUndefined()
      expect(result.multiValueHeaders['X-Api-Key']).toBeUndefined()
      expect(result.multiValueHeaders['Content-Type']).toEqual(['json'])
    })

    test('expect both headers and multiValueHeaders to be redacted together on the same v1 event', () => {
      const result = redactEvent(v1RestEvent) as {
        headers: Record<string, string>
        multiValueHeaders: Record<string, string[]>
      }

      expect(result.headers.Authorization).toBeUndefined()
      expect(result.headers['X-Api-Key']).toBeUndefined()
      expect(result.multiValueHeaders.Authorization).toBeUndefined()
      expect(result.multiValueHeaders['X-Api-Key']).toBeUndefined()
    })

    test('expect events without multiValueHeaders (HTTP API v2) to pass through without adding the field', () => {
      const result = redactEvent(event) as { multiValueHeaders: unknown }

      expect(result.multiValueHeaders).toBeUndefined()
    })
  })
})
