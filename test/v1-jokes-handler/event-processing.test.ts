import { corsMethods, corsOrigins, defaultOrigin, resourceByID } from '@v1-jokes-handler/config'
import {
  getCorsHeadersFromEvent,
  getIntFromParameter,
  getListFromParameter,
  getPayloadFromEvent,
  getReferrerOriginFromEvent,
  Payload,
} from '@v1-jokes-handler/event-processing'
import { APIGatewayEvent } from '@v1-jokes-handler/index'

describe('event-processing', () => {
  const origin = 'https://somemadeuporigin.notreal'
  const event = {
    headers: { Origin: origin },
    resource: resourceByID,
  } as unknown as APIGatewayEvent

  describe('getReferrerOriginFromEvent', () => {
    test('expect Origin header when present', () => {
      const result: string = getReferrerOriginFromEvent(event)
      expect(result).toEqual(origin)
    })

    test('expect Referer header when Origin header not present', () => {
      const tempEvent = {
        headers: { Referer: `${origin}/index.html` },
      } as unknown as APIGatewayEvent

      const result: string = getReferrerOriginFromEvent(tempEvent)
      expect(result).toEqual(origin)
    })

    test('expect empty string when no origin can be determined', () => {
      const tempEvent = {} as unknown as APIGatewayEvent
      const result: string = getReferrerOriginFromEvent(tempEvent)
      expect(result).toEqual('')
    })
  })

  describe('getCorsHeadersFromEvent', () => {
    test('expect default origin if origin not in corsOrigin', () => {
      const result: Payload = getCorsHeadersFromEvent(event)
      expect(result).toEqual(
        expect.objectContaining({
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
          'Access-Control-Allow-Origin': defaultOrigin,
        })
      )
    })

    test('expect current origin if in corsOrigins', () => {
      const firstNonDefaultCorsOrigin = corsOrigins.filter((origin: string) => origin != defaultOrigin)[0]
      const tempEvent = {
        ...event,
        headers: { Origin: firstNonDefaultCorsOrigin },
      } as unknown as APIGatewayEvent

      const result: Payload = getCorsHeadersFromEvent(tempEvent)
      expect(result).toEqual(
        expect.objectContaining({
          'Access-Control-Allow-Origin': firstNonDefaultCorsOrigin,
        })
      )
    })

    test.each([
      [resourceByID, corsMethods[resourceByID]],
      ['/unrecognized', 'OPTIONS'],
    ])('expect methods value based on resource (%s should return %s)', (resource, methods) => {
      const tempEvent = { ...event, resource } as unknown as APIGatewayEvent

      const result: Payload = getCorsHeadersFromEvent(tempEvent)
      expect(result).toEqual(
        expect.objectContaining({
          'Access-Control-Allow-Methods': methods,
        })
      )
    })
  })

  describe('getPayloadFromEvent', () => {
    test.each([true, false])(
      'expect bodies to be base64 decoded, when necessary (isBase64Encoded=%s)',
      (isBase64Encoded: boolean) => {
        const expectedResult = { motto: 'veni vidi vici' }
        const tempEvent = {
          ...event,
          isBase64Encoded,
          body: isBase64Encoded
            ? Buffer.from(JSON.stringify(expectedResult)).toString('base64')
            : JSON.stringify(expectedResult),
        } as unknown as APIGatewayEvent

        const result: Payload = getPayloadFromEvent(tempEvent)
        expect(result).toEqual(expectedResult)
      }
    )

    test('expect empty object when the json cannot be parsed', () => {
      const malformedJson = 'malformed json'
      const tempEvent = {
        ...event,
        body: malformedJson,
      } as unknown as APIGatewayEvent

      const result: Payload = getPayloadFromEvent(tempEvent)
      expect(result).toEqual({})
    })
  })

  describe('getIntFromParameter', () => {
    test('expect query string parameter returned successfully', () => {
      const expectedResult = 14
      const parameterName = 'fnord'
      const tempEvent = {
        ...event,
        queryStringParameters: { [parameterName]: `${expectedResult}` },
      } as unknown as APIGatewayEvent

      const result = getIntFromParameter(tempEvent, parameterName, { default: expectedResult + 1 })
      expect(result).toEqual(expectedResult)
    })

    test('expect default when query string parameter is not an integer', () => {
      const expectedResult = 8
      const parameterName = 'foo'
      const tempEvent = {
        ...event,
        queryStringParameters: { [parameterName]: 'bar' },
      } as unknown as APIGatewayEvent

      const result = getIntFromParameter(tempEvent, parameterName, { default: expectedResult })
      expect(result).toEqual(expectedResult)
    })

    test('expect default when query string parameter not found', () => {
      const expectedResult = 14
      const parameterName = 'fnord'
      const tempEvent = { ...event, queryStringParameters: {} } as unknown as APIGatewayEvent

      const result = getIntFromParameter(tempEvent, parameterName, { default: expectedResult })
      expect(result).toEqual(expectedResult)
    })

    test('expect default when no query string parameters', () => {
      const expectedResult = 10
      const parameterName = 'fnord'
      const tempEvent = {} as unknown as APIGatewayEvent

      const result = getIntFromParameter(tempEvent, parameterName, { default: expectedResult })
      expect(result).toEqual(expectedResult)
    })

    test('expect undefined when no query string parameters and no default', () => {
      const parameterName = 'fnord'
      const tempEvent = {} as unknown as APIGatewayEvent

      const result = getIntFromParameter(tempEvent, parameterName)
      expect(result).toEqual(undefined)
    })
  })

  describe('getListFromParameter', () => {
    test.each([[['John', 'Paul', 'George', 'Ringo']], [['black']]])(
      'expect parameter list when one is provided (expected result=%s)',
      (expectedResult: string[]) => {
        const parameterName = 'beatles'
        const tempEvent = {
          ...event,
          queryStringParameters: { [parameterName]: expectedResult.join(',') },
        } as unknown as APIGatewayEvent

        const result = getListFromParameter(tempEvent, parameterName)
        expect(result).toEqual(expectedResult)
      }
    )

    test('expect an empty list when a different parameter is specified', () => {
      const parameterName = 'fnord'
      const tempEvent = {
        ...event,
        queryStringParameters: { foo: 'bar' },
      } as unknown as APIGatewayEvent

      const result = getListFromParameter(tempEvent, parameterName)
      expect(result).toEqual([])
    })

    test('expect an empty list when no parameter is specified', () => {
      const parameterName = 'nirvana'
      const tempEvent = {} as unknown as APIGatewayEvent

      const result = getListFromParameter(tempEvent, parameterName)
      expect(result).toEqual([])
    })
  })
})
