import { mocked } from 'jest-mock'

import * as dynamodb from '@services/dynamodb'
import * as events from '@utils/events'
import { index, joke } from '../__mocks__'
import { APIGatewayProxyEventV2 } from '@types'
import eventJson from '@events/get-by-id.json'
import { getByIdHandler } from '@handlers/get-by-id'
import status from '@utils/status'

jest.mock('@services/dynamodb')
jest.mock('@utils/events')
jest.mock('@utils/logging')

describe('get-by-id', () => {
  const event = eventJson as unknown as APIGatewayProxyEventV2

  beforeAll(() => {
    mocked(dynamodb).getDataByIndex.mockResolvedValue(joke)
    mocked(events).getIdFromEvent.mockReturnValue(index)
  })

  describe('getByIdHandler', () => {
    test('expect BAD_REQUEST on invalid index', async () => {
      mocked(events).getIdFromEvent.mockImplementationOnce(() => {
        throw new Error('Bad request')
      })
      const result = await getByIdHandler(event)

      expect(result).toEqual(expect.objectContaining(status.BAD_REQUEST))
    })

    test('expect NOT_FOUND on getDataByIndex reject', async () => {
      mocked(dynamodb).getDataByIndex.mockRejectedValueOnce(undefined)
      const result = await getByIdHandler(event)

      expect(result).toEqual(expect.objectContaining(status.NOT_FOUND))
    })

    test('expect OK when index exists', async () => {
      const result = await getByIdHandler(event)

      expect(result).toEqual({ ...status.OK, body: JSON.stringify({ ...joke, index }) })
    })
  })
})
