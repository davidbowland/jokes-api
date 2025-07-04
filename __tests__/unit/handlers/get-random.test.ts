import crypto from 'crypto'
import { mocked } from 'jest-mock'

import { index, joke } from '../__mocks__'
import eventJson from '@events/get-random.json'
import { getRandomHandler } from '@handlers/get-random'
import * as dynamodb from '@services/dynamodb'
import { APIGatewayProxyEventV2 } from '@types'
import status from '@utils/status'

jest.mock('@services/dynamodb')
jest.mock('@utils/logging')

describe('get-random', () => {
  const count = 102
  const event = eventJson as unknown as APIGatewayProxyEventV2
  const mockRandomInt = jest.fn()

  beforeAll(() => {
    mockRandomInt.mockReturnValue(index)
    jest.spyOn(crypto, 'randomInt').mockImplementation((...args) => mockRandomInt(...args))

    mocked(dynamodb).getJokeByIndex.mockResolvedValue(joke)
    mocked(dynamodb).getHighestIndex.mockResolvedValue(count)
  })

  describe('getRandomHandler', () => {
    test('expect NOT_FOUND when no jokes', async () => {
      mocked(dynamodb).getHighestIndex.mockResolvedValueOnce(0)
      const result = await getRandomHandler(event)

      expect(result).toEqual(expect.objectContaining(status.NOT_FOUND))
    })

    test('expect INTERNAL_SERVER_ERROR on getJokeByIndex reject', async () => {
      mocked(dynamodb).getJokeByIndex.mockRejectedValueOnce(undefined)
      const result = await getRandomHandler(event)

      expect(result).toEqual(status.INTERNAL_SERVER_ERROR)
    })

    test('expect OK and joke', async () => {
      const result = await getRandomHandler(event)

      expect(result).toEqual({ ...status.OK, body: JSON.stringify([{ data: joke, id: 44 }]) })
    })

    test('expect count of jokes when count passed', async () => {
      const tempEvent = { ...event, queryStringParameters: { count: '2' } } as unknown as APIGatewayProxyEventV2
      const result = await getRandomHandler(tempEvent)

      expect(result).toEqual({
        ...status.OK,
        body: JSON.stringify([
          { data: joke, id: 44 },
          { data: joke, id: 43 },
        ]),
      })
    })

    test('expect max number of jokes when count passed is greater', async () => {
      const tempEvent = { ...event, queryStringParameters: { count: '3' } } as unknown as APIGatewayProxyEventV2
      mocked(dynamodb).getHighestIndex.mockResolvedValueOnce(2)
      mockRandomInt.mockReturnValueOnce(0)
      mockRandomInt.mockReturnValueOnce(0)
      const result = await getRandomHandler(tempEvent)

      expect(result).toEqual({
        ...status.OK,
        body: JSON.stringify([
          { data: joke, id: 2 },
          { data: joke, id: 1 },
        ]),
      })
    })

    test('expect max count of jokes when count passed is greater', async () => {
      const tempEvent = { ...event, queryStringParameters: { count: '10' } } as unknown as APIGatewayProxyEventV2
      const result = await getRandomHandler(tempEvent)

      expect(result).toEqual({
        ...status.OK,
        body: JSON.stringify([
          { data: joke, id: 45 },
          { data: joke, id: 44 },
          { data: joke, id: 43 },
        ]),
      })
    })

    test('expect max count of jokes when no count passed', async () => {
      const tempEvent = { ...event, queryStringParameters: undefined } as unknown as APIGatewayProxyEventV2
      const result = await getRandomHandler(tempEvent)

      expect(result).toEqual({
        ...status.OK,
        body: JSON.stringify([
          { data: joke, id: 45 },
          { data: joke, id: 44 },
          { data: joke, id: 43 },
        ]),
      })
    })

    test('expect avoids to be honored', async () => {
      const tempEvent = {
        ...event,
        queryStringParameters: { avoid: '19,47,37', count: '3' },
      } as unknown as APIGatewayProxyEventV2
      const result = await getRandomHandler(tempEvent)

      expect(result).toEqual({
        ...status.OK,
        body: JSON.stringify([
          { data: joke, id: 48 },
          { data: joke, id: 46 },
          { data: joke, id: 45 },
        ]),
      })
    })
  })
})
