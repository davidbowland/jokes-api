import { APIGatewayProxyEventV2 } from '@types'
import { extractJokeFromEvent, extractJsonPatchFromEvent, formatJoke, getIdFromEvent } from '@utils/events'

describe('events', () => {
  describe('formatJoke', () => {
    test('expect valid joke to pass', () => {
      const result = formatJoke({ contents: 'LOL' })

      expect(result).toEqual({ contents: 'LOL', version: 1 })
    })

    test('expect invalid joke to throw', () => {
      expect(() => formatJoke({} as any)).toThrow()
    })
  })

  describe('extractJokeFromEvent', () => {
    test('expect joke extracted from event body', () => {
      const event = { body: JSON.stringify({ contents: 'LOL' }) } as unknown as APIGatewayProxyEventV2
      const result = extractJokeFromEvent(event)

      expect(result).toEqual({ contents: 'LOL', version: 1 })
    })

    test('expect base64 body decoded', () => {
      const event = {
        body: Buffer.from(JSON.stringify({ contents: 'LOL' })).toString('base64'),
        isBase64Encoded: true,
      } as unknown as APIGatewayProxyEventV2
      const result = extractJokeFromEvent(event)

      expect(result).toEqual({ contents: 'LOL', version: 1 })
    })
  })

  describe('extractJsonPatchFromEvent', () => {
    test('expect patch operations extracted from event body', () => {
      const ops = [{ op: 'replace', path: '/contents', value: 'LOL' }]
      const event = { body: JSON.stringify(ops) } as unknown as APIGatewayProxyEventV2
      const result = extractJsonPatchFromEvent(event)

      expect(result).toEqual(ops)
    })
  })

  describe('getIdFromEvent', () => {
    test('expect id returned from path parameters', () => {
      const event = { pathParameters: { id: 'j7b2mx' } } as unknown as APIGatewayProxyEventV2
      const result = getIdFromEvent(event)

      expect(result).toEqual('j7b2mx')
    })

    test('expect error when id is missing', () => {
      const event = { pathParameters: {} } as unknown as APIGatewayProxyEventV2

      expect(() => getIdFromEvent(event)).toThrow('Invalid joke ID')
    })
  })
})
