import { index, joke } from '../__mocks__'
import eventJson from '@events/put-item.json'
import { putItemHandler } from '@handlers/put-item'
import { mocked } from 'jest-mock'
import * as dynamodb from '@services/dynamodb'
import { APIGatewayProxyEventV2 } from '@types'
import * as events from '@utils/events'
import status from '@utils/status'

jest.mock('@services/dynamodb')
jest.mock('@utils/events')
jest.mock('@utils/logging')

describe('put-item', () => {
  const event = eventJson as unknown as APIGatewayProxyEventV2

  beforeAll(() => {
    mocked(dynamodb).getDataByIndex.mockResolvedValue(joke)
    mocked(dynamodb).setDataByIndex.mockResolvedValue(undefined)
    mocked(events).extractJokeFromEvent.mockResolvedValue(joke)
    mocked(events).getCorsHeaders.mockResolvedValue({})
    mocked(events).getIdFromEvent.mockResolvedValue(index)
  })

  describe('putItemHandler', () => {
    test('expect BAD_REQUEST when invalid index', async () => {
      mocked(events).getIdFromEvent.mockRejectedValueOnce('Bad request')
      const result = await putItemHandler(event)
      expect(result).toEqual(expect.objectContaining(status.BAD_REQUEST))
    })

    test('expect BAD_REQUEST when joke is invalid', async () => {
      mocked(events).extractJokeFromEvent.mockRejectedValueOnce('Bad request')
      const result = await putItemHandler(event)
      expect(result).toEqual(expect.objectContaining(status.BAD_REQUEST))
    })

    test("expect NOT_FOUND when joke doesn't exist", async () => {
      mocked(dynamodb).getDataByIndex.mockRejectedValueOnce(undefined)
      const result = await putItemHandler(event)
      expect(result).toEqual(status.NOT_FOUND)
    })

    test('expect INTERNAL_SERVER_ERROR on setDataByIndex reject', async () => {
      mocked(dynamodb).setDataByIndex.mockRejectedValueOnce(undefined)
      const result = await putItemHandler(event)
      expect(result).toEqual(expect.objectContaining(status.INTERNAL_SERVER_ERROR))
    })

    test('expect OK and body when joke already exists', async () => {
      const result = await putItemHandler(event)
      expect(result).toEqual(expect.objectContaining({ ...status.OK, body: JSON.stringify(joke) }))
    })
  })
})
