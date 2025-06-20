import { mocked } from 'jest-mock'

import { index, joke } from '../__mocks__'
import eventJson from '@events/get-all-items.json'
import { getAllItemsHandler } from '@handlers/get-all-items'
import * as dynamodb from '@services/dynamodb'
import { APIGatewayProxyEventV2 } from '@types'
import status from '@utils/status'

jest.mock('@services/dynamodb')
jest.mock('@utils/logging')

describe('get-all-items', () => {
  const event = eventJson as unknown as APIGatewayProxyEventV2

  beforeAll(() => {
    mocked(dynamodb).scanJokes.mockResolvedValue([{ data: joke, id: index }])
  })

  describe('getAllItemsHandler', () => {
    test('expect INTERNAL_SERVER_ERROR on scanJokes reject', async () => {
      mocked(dynamodb).scanJokes.mockRejectedValueOnce(undefined)
      const result = await getAllItemsHandler(event)

      expect(result).toEqual(status.INTERNAL_SERVER_ERROR)
    })

    test('expect OK and data', async () => {
      const result = await getAllItemsHandler(event)

      expect(result).toEqual({ ...status.OK, body: JSON.stringify([{ data: joke, id: index }]) })
    })
  })
})
