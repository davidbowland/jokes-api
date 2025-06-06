import crypto from 'crypto'
import { mocked } from 'jest-mock'

import { index, joke } from '../__mocks__'
import eventJson from '@events/get-initial.json'
import { getInitialHandler } from '@handlers/get-initial'
import * as dynamodb from '@services/dynamodb'
import { APIGatewayProxyEventV2 } from '@types'
import status from '@utils/status'

jest.mock('@services/dynamodb')
jest.mock('@utils/logging')

describe('get-initial', () => {
  const count = 102
  const event = eventJson as unknown as APIGatewayProxyEventV2
  const mockRandomInt = jest.fn()

  beforeAll(() => {
    mockRandomInt.mockReturnValue(index - 1)
    jest.spyOn(crypto, 'randomInt').mockImplementation((...args) => mockRandomInt(...args))

    mocked(dynamodb).getDataByIndex.mockResolvedValue(joke)
    mocked(dynamodb).getHighestIndex.mockResolvedValue(count)
  })

  describe('getInitialHandler', () => {
    test('expect NOT_FOUND when no jokes', async () => {
      mocked(dynamodb).getHighestIndex.mockResolvedValueOnce(0)
      const result = await getInitialHandler(event)

      expect(result).toEqual(expect.objectContaining(status.NOT_FOUND))
    })

    test('expect INTERNAL_SERVER_ERROR on getDataByIndex reject', async () => {
      mocked(dynamodb).getDataByIndex.mockRejectedValueOnce(undefined)
      const result = await getInitialHandler(event)

      expect(result).toEqual(status.INTERNAL_SERVER_ERROR)
    })

    test('expect OK, count, and joke', async () => {
      const result = await getInitialHandler(event)

      expect(result).toEqual({ ...status.OK, body: JSON.stringify({ count, joke: { data: joke, id: index } }) })
    })
  })
})
