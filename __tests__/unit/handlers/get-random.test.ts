import crypto from 'crypto'
import { mocked } from 'jest-mock'

import { id, joke } from '../__mocks__'
import eventJson from '@events/get-random.json'
import { getRandomHandler } from '@handlers/get-random'
import * as dynamodb from '@services/dynamodb'
import { APIGatewayProxyEventV2 } from '@types'
import status from '@utils/status'

jest.mock('@services/dynamodb')
jest.mock('@utils/logging')

describe('get-random', () => {
  const roster = [id, 'abc123', 'def456', 'ghi789', 'jkl012']
  const event = eventJson as unknown as APIGatewayProxyEventV2
  const mockRandomInt = jest.fn()

  beforeAll(() => {
    mockRandomInt.mockReturnValue(0)
    jest.spyOn(crypto, 'randomInt').mockImplementation((...args) => mockRandomInt(...args))

    mocked(dynamodb).getJokesByIds.mockImplementation(async (ids) => ids.map((jokeId) => ({ data: joke, id: jokeId })))
    mocked(dynamodb).getRoster.mockResolvedValue(roster)
  })

  describe('getRandomHandler', () => {
    test('expect NOT_FOUND when no jokes', async () => {
      mocked(dynamodb).getRoster.mockResolvedValueOnce([])
      const result = await getRandomHandler(event)

      expect(result).toEqual(expect.objectContaining(status.NOT_FOUND))
    })

    test('expect INTERNAL_SERVER_ERROR on getRoster reject', async () => {
      mocked(dynamodb).getRoster.mockRejectedValueOnce(undefined)
      const result = await getRandomHandler(event)

      expect(result).toEqual(status.INTERNAL_SERVER_ERROR)
    })

    test('expect OK and jokes', async () => {
      const result = await getRandomHandler(event)

      expect(result).toEqual(expect.objectContaining(status.OK))
      const body = JSON.parse((result as any).body)
      expect(body.length).toBeLessThanOrEqual(3)
      expect(body[0].data).not.toHaveProperty('version')
    })

    test('expect count of jokes when count passed', async () => {
      const tempEvent = { ...event, queryStringParameters: { count: '2' } } as unknown as APIGatewayProxyEventV2
      const result = await getRandomHandler(tempEvent)

      const body = JSON.parse((result as any).body)
      expect(body.length).toEqual(2)
    })

    test('expect avoids to be honored', async () => {
      const tempEvent = {
        ...event,
        queryStringParameters: { avoid: `${id},abc123`, count: '3' },
      } as unknown as APIGatewayProxyEventV2
      const result = await getRandomHandler(tempEvent)

      const body = JSON.parse((result as any).body)
      expect(body.every((item: any) => item.id !== id && item.id !== 'abc123')).toBe(true)
    })

    test('expect NOT_FOUND when all jokes are avoided', async () => {
      const tempEvent = {
        ...event,
        queryStringParameters: { avoid: roster.join(','), count: '1' },
      } as unknown as APIGatewayProxyEventV2
      const result = await getRandomHandler(tempEvent)

      expect(result).toEqual(expect.objectContaining(status.NOT_FOUND))
    })
  })
})
