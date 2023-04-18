import { mocked } from 'jest-mock'

import * as dynamodb from '@services/dynamodb'
import { APIGatewayProxyEventV2 } from '@types'
import eventJson from '@events/get-count.json'
import { getCountHandler } from '@handlers/get-count'
import status from '@utils/status'

jest.mock('@services/dynamodb')
jest.mock('@utils/logging')

describe('get-count', () => {
  const count = 102
  const event = eventJson as unknown as APIGatewayProxyEventV2

  beforeAll(() => {
    mocked(dynamodb).getHighestIndex.mockResolvedValue(count)
  })

  describe('getCountHandler', () => {
    test('expect NOT_FOUND when no jokes', async () => {
      mocked(dynamodb).getHighestIndex.mockRejectedValueOnce(0)
      const result = await getCountHandler(event)

      expect(result).toEqual(status.INTERNAL_SERVER_ERROR)
    })

    test('expect OK and count', async () => {
      const result = await getCountHandler(event)

      expect(result).toEqual({ ...status.OK, body: JSON.stringify({ count }) })
    })
  })
})
