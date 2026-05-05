import { mocked } from 'jest-mock'

import { id } from '../__mocks__'
import eventJson from '@events/get-count.json'
import { getCountHandler } from '@handlers/get-count'
import * as dynamodb from '@services/dynamodb'
import { APIGatewayProxyEventV2 } from '@types'
import status from '@utils/status'

jest.mock('@services/dynamodb')
jest.mock('@utils/logging')

describe('get-count', () => {
  const roster = [id, 'abc123', 'def456']
  const event = eventJson as unknown as APIGatewayProxyEventV2

  beforeAll(() => {
    mocked(dynamodb).getRoster.mockResolvedValue(roster)
  })

  describe('getCountHandler', () => {
    test('expect INTERNAL_SERVER_ERROR on getRoster reject', async () => {
      mocked(dynamodb).getRoster.mockRejectedValueOnce(undefined)
      const result = await getCountHandler(event)

      expect(result).toEqual(status.INTERNAL_SERVER_ERROR)
    })

    test('expect OK and count', async () => {
      const result = await getCountHandler(event)

      expect(result).toEqual({ ...status.OK, body: JSON.stringify({ count: 3 }) })
    })
  })
})
