import { index, joke } from '../__mocks__'
import eventJson from '@events/get-all-items.json'
import { getAllItemsHandler } from '@handlers/get-all-items'
import { mocked } from 'jest-mock'
import * as dynamodb from '@services/dynamodb'
import { APIGatewayProxyEventV2 } from '@types'
import * as events from '@utils/events'
import status from '@utils/status'

jest.mock('@services/dynamodb')
jest.mock('@utils/events')
jest.mock('@utils/logging')

describe('get-all-items', () => {
  const event = eventJson as unknown as APIGatewayProxyEventV2

  beforeAll(() => {
    mocked(dynamodb).scanData.mockResolvedValue({ [index]: joke })
    mocked(events).getCorsHeaders.mockResolvedValue({})
  })

  describe('getAllItemsHandler', () => {
    test('expect INTERNAL_SERVER_ERROR on scanData reject', async () => {
      mocked(dynamodb).scanData.mockRejectedValueOnce(undefined)
      const result = await getAllItemsHandler(event)
      expect(result).toEqual(expect.objectContaining(status.INTERNAL_SERVER_ERROR))
    })

    test('expect OK and data', async () => {
      const result = await getAllItemsHandler(event)
      expect(result).toEqual({ ...status.OK, body: JSON.stringify({ [index]: joke }) })
    })
  })
})
