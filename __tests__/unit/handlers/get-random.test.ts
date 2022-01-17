import { index, joke } from '../__mocks__'
import eventJson from '@events/get-random.json'
import { getRandomHandler } from '@handlers/get-random'
import { mocked } from 'jest-mock'
import * as dynamodb from '@services/dynamodb'
import { APIGatewayEvent } from '@types'
import status from '@utils/status'

jest.mock('@services/dynamodb')
jest.mock('@utils/events')
jest.mock('@utils/logging')

describe('get-random', () => {
  const event = eventJson as unknown as APIGatewayEvent
  const mathRandom = Math.random

  beforeAll(() => {
    mocked(dynamodb).getDataByIndex.mockResolvedValue(joke)
    mocked(dynamodb).getHighestIndex.mockResolvedValue(102)
    Math.random = jest.fn().mockReturnValue(index / 100)
  })

  afterAll(() => {
    Math.random = mathRandom
  })

  describe('getRandomHandler', () => {
    test('expect NOT_FOUND when no jokes', async () => {
      mocked(dynamodb).getHighestIndex.mockRejectedValueOnce(0)
      const result = await getRandomHandler(event)
      expect(result).toEqual(expect.objectContaining(status.NOT_FOUND))
    })

    test('expect INTERNAL_SERVER_ERROR on getDataByIndex reject', async () => {
      mocked(dynamodb).getDataByIndex.mockRejectedValueOnce(undefined)
      const result = await getRandomHandler(event)
      expect(result).toEqual(expect.objectContaining(status.INTERNAL_SERVER_ERROR))
    })

    test('expect OK and joke', async () => {
      const result = await getRandomHandler(event)
      expect(result).toEqual({ ...status.OK, body: JSON.stringify({ 42: joke }) })
    })

    test('expect count of jokes when count passed', async () => {
      const tempEvent = { ...event, queryStringParameters: { count: '2' } } as unknown as APIGatewayEvent
      const result = await getRandomHandler(tempEvent)
      expect(result).toEqual({ ...status.OK, body: '{"42":{"contents":"ROFL"},"43":{"contents":"ROFL"}}' })
    })

    test('expect max number of jokes when count passed is greater', async () => {
      const tempEvent = { ...event, queryStringParameters: { count: '3' } } as unknown as APIGatewayEvent
      mocked(dynamodb).getHighestIndex.mockResolvedValueOnce(2)

      const result = await getRandomHandler(tempEvent)
      expect(result).toEqual({ ...status.OK, body: '{"0":{"contents":"ROFL"},"1":{"contents":"ROFL"}}' })
    })

    test('expect max count of jokes when count passed is greater', async () => {
      const tempEvent = { ...event, queryStringParameters: { count: '10' } } as unknown as APIGatewayEvent
      const result = await getRandomHandler(tempEvent)
      expect(result).toEqual({
        ...status.OK,
        body: '{"42":{"contents":"ROFL"},"43":{"contents":"ROFL"},"44":{"contents":"ROFL"}}',
      })
    })

    test('expect max count of jokes when no count passed', async () => {
      const tempEvent = { ...event, queryStringParameters: undefined } as unknown as APIGatewayEvent
      const result = await getRandomHandler(tempEvent)
      expect(result).toEqual({
        ...status.OK,
        body: '{"42":{"contents":"ROFL"},"43":{"contents":"ROFL"},"44":{"contents":"ROFL"}}',
      })
    })

    test('expect avoids to be honored', async () => {
      const tempEvent = {
        ...event,
        queryStringParameters: { avoid: '19,42,37', count: '1' },
      } as unknown as APIGatewayEvent
      const result = await getRandomHandler(tempEvent)
      expect(result).toEqual({ ...status.OK, body: JSON.stringify({ 45: joke }) })
    })
  })
})