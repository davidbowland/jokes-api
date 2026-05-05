import crypto from 'crypto'
import { mocked } from 'jest-mock'

import { id, joke } from '../__mocks__'
import eventJson from '@events/get-initial.json'
import { getInitialHandler } from '@handlers/get-initial'
import * as dynamodb from '@services/dynamodb'
import { APIGatewayProxyEventV2 } from '@types'
import status from '@utils/status'

jest.mock('@services/dynamodb')
jest.mock('@utils/logging')

describe('get-initial', () => {
  const roster = [id, 'abc123', 'def456']
  const event = eventJson as unknown as APIGatewayProxyEventV2
  const mockRandomInt = jest.fn()

  beforeAll(() => {
    mockRandomInt.mockReturnValue(0)
    jest.spyOn(crypto, 'randomInt').mockImplementation((...args) => mockRandomInt(...args))

    mocked(dynamodb).getJokeById.mockResolvedValue(joke)
    mocked(dynamodb).getRoster.mockResolvedValue(roster)
  })

  describe('getInitialHandler', () => {
    test('expect NOT_FOUND when no jokes', async () => {
      mocked(dynamodb).getRoster.mockResolvedValueOnce([])
      const result = await getInitialHandler(event)

      expect(result).toEqual(expect.objectContaining(status.NOT_FOUND))
    })

    test('expect INTERNAL_SERVER_ERROR on getJokeById reject', async () => {
      mocked(dynamodb).getJokeById.mockRejectedValueOnce(undefined)
      const result = await getInitialHandler(event)

      expect(result).toEqual(status.INTERNAL_SERVER_ERROR)
    })

    test('expect OK, count, and joke', async () => {
      const result = await getInitialHandler(event)
      const { version: _, ...jokeWithoutVersion } = joke

      expect(result).toEqual({
        ...status.OK,
        body: JSON.stringify({ count: 3, joke: { data: jokeWithoutVersion, id } }),
      })
    })
  })
})
