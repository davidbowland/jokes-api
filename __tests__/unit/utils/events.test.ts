import { index, joke, jsonPatchOperations } from '../__mocks__'
import getEventJson from '@events/get-by-id.json'
import patchEventJson from '@events/patch-item.json'
import putEventJson from '@events/put-item.json'
import { APIGatewayProxyEventV2 } from '@types'
import { extractJokeFromEvent, extractJsonPatchFromEvent, getIdFromEvent } from '@utils/events'

describe('events', () => {
  describe('extractJokeFromEvent', () => {
    const event = putEventJson as unknown as APIGatewayProxyEventV2

    test('expect joke from event', async () => {
      const result = await extractJokeFromEvent(event)
      expect(result).toEqual(joke)
    })

    test('expect joke from event in base64', async () => {
      const tempEvent = {
        ...event,
        body: Buffer.from(event.body).toString('base64'),
        isBase64Encoded: true,
      } as unknown as APIGatewayProxyEventV2
      const result = await extractJokeFromEvent(tempEvent)
      expect(result).toEqual(joke)
    })

    test('expect reject on invalid event', () => {
      const tempEvent = { ...event, body: JSON.stringify({}) } as unknown as APIGatewayProxyEventV2
      expect(() => extractJokeFromEvent(tempEvent)).toThrow()
    })

    test('expect joke to be formatted', async () => {
      const tempEmail = {
        ...joke,
        foo: 'bar',
      }
      const tempEvent = { ...event, body: JSON.stringify(tempEmail) } as unknown as APIGatewayProxyEventV2
      const result = await extractJokeFromEvent(tempEvent)
      expect(result).toEqual(joke)
    })
  })

  describe('extractJsonPatchFromEvent', () => {
    test('expect preference from event', async () => {
      const result = await extractJsonPatchFromEvent(patchEventJson as unknown as APIGatewayProxyEventV2)
      expect(result).toEqual(jsonPatchOperations)
    })
  })

  describe('getIdFromEvent', () => {
    test('expect ID from event', async () => {
      const result = await getIdFromEvent(getEventJson as unknown as APIGatewayProxyEventV2)
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
