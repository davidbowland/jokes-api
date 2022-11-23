import { extractJokeFromEvent, extractJsonPatchFromEvent, getIdFromEvent } from '@utils/events'
import { index, joke, jsonPatchOperations } from '../__mocks__'
import { APIGatewayProxyEventV2 } from '@types'
import getEventJson from '@events/get-by-id.json'
import patchEventJson from '@events/patch-item.json'
import postEventJson from '@events/post-item.json'

describe('events', () => {
  describe('extractJokeFromEvent', () => {
    const event = postEventJson as unknown as APIGatewayProxyEventV2

    test('expect joke from event', () => {
      const result = extractJokeFromEvent(event)
      expect(result).toEqual(joke)
    })

    test('expect joke from event in base64', () => {
      const tempEvent = {
        ...event,
        body: Buffer.from(event.body).toString('base64'),
        isBase64Encoded: true,
      } as unknown as APIGatewayProxyEventV2
      const result = extractJokeFromEvent(tempEvent)
      expect(result).toEqual(joke)
    })

    test('expect reject on invalid event', () => {
      const tempEvent = { ...event, body: JSON.stringify({}) } as unknown as APIGatewayProxyEventV2
      expect(() => extractJokeFromEvent(tempEvent)).toThrow()
    })

    test('expect joke to be formatted', () => {
      const tempJoke = {
        ...joke,
        foo: 'bar',
      }
      const tempEvent = { ...event, body: JSON.stringify(tempJoke) } as unknown as APIGatewayProxyEventV2
      const result = extractJokeFromEvent(tempEvent)
      expect(result).toEqual(joke)
    })
  })

  describe('extractJsonPatchFromEvent', () => {
    test('expect preference from event', () => {
      const result = extractJsonPatchFromEvent(patchEventJson as unknown as APIGatewayProxyEventV2)
      expect(result).toEqual(jsonPatchOperations)
    })
  })

  describe('getIdFromEvent', () => {
    test('expect ID from event', () => {
      const result = getIdFromEvent(getEventJson as unknown as APIGatewayProxyEventV2)
      expect(result).toEqual(index)
    })

    test('expect reject on invalid ID', () => {
      const tempEvent = {} as unknown as APIGatewayProxyEventV2
      expect(() => getIdFromEvent(tempEvent)).toThrow()
    })

    test('expect reject on non-integer ID', () => {
      const tempEvent = { pathParameters: { index: 'fnord' } } as unknown as APIGatewayProxyEventV2
      expect(() => getIdFromEvent(tempEvent)).toThrow()
    })
  })
})
