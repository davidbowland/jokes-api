import { mocked } from 'jest-mock'

import { index, joke } from '../__mocks__'
import eventJson from '@events/delete-item.json'
import { deleteByIdHandler } from '@handlers/delete-item'
import * as dynamodb from '@services/dynamodb'
import { APIGatewayProxyEventV2 } from '@types'
import * as events from '@utils/events'
import status from '@utils/status'

jest.mock('@services/dynamodb')
jest.mock('@utils/events')
jest.mock('@utils/logging')

describe('delete-item', () => {
  const event = eventJson as unknown as APIGatewayProxyEventV2
  const highestIndex = index * 2

  beforeAll(() => {
    mocked(dynamodb).getJokeByIndex.mockResolvedValue(joke)
    mocked(dynamodb).getHighestIndex.mockResolvedValue(highestIndex)
    mocked(events).getIdFromEvent.mockReturnValue(index)
  })

  describe('deleteByIdHandler', () => {
    test('expect BAD_REQUEST on invalid index', async () => {
      mocked(events).getIdFromEvent.mockImplementationOnce(() => {
        throw new Error('Bad request')
      })
      const result = await deleteByIdHandler(event)

      expect(result).toEqual(expect.objectContaining(status.BAD_REQUEST))
    })

    test('expect NOT_FOUND on when index < 1', async () => {
      mocked(events).getIdFromEvent.mockReturnValueOnce(0)
      const result = await deleteByIdHandler(event)

      expect(result).toEqual(expect.objectContaining(status.NOT_FOUND))
    })

    test('expect INTERNAL_SERVER_ERROR on deleteJokeByIndex reject', async () => {
      mocked(dynamodb).deleteJokeByIndex.mockRejectedValueOnce(undefined)
      const result = await deleteByIdHandler(event)

      expect(result).toEqual(status.INTERNAL_SERVER_ERROR)
    })

    test('expect NO_CONTENT when index is higher than max index', async () => {
      mocked(dynamodb).getHighestIndex.mockResolvedValueOnce(index - 2)
      const result = await deleteByIdHandler(event)

      expect(result).toEqual(status.NO_CONTENT)
    })

    test('expect setJokeByIndex not called when index == highestIndex', async () => {
      mocked(dynamodb).getHighestIndex.mockResolvedValueOnce(index)
      await deleteByIdHandler(event)

      expect(mocked(dynamodb).setJokeByIndex).toHaveBeenCalledTimes(0)
    })

    test('expect setJokeByIndex called with joke', async () => {
      await deleteByIdHandler(event)

      expect(mocked(dynamodb).setJokeByIndex).toHaveBeenCalledWith(index, joke)
    })

    test('expect deleteJokeByIndex called with highest index', async () => {
      await deleteByIdHandler(event)

      expect(mocked(dynamodb).deleteJokeByIndex).toHaveBeenCalledWith(highestIndex)
    })

    test('expect setHighestIndex called with highest index - 1', async () => {
      await deleteByIdHandler(event)

      expect(mocked(dynamodb).setHighestIndex).toHaveBeenCalledWith(highestIndex - 1)
    })

    test('expect OK when index exists', async () => {
      const result = await deleteByIdHandler(event)

      expect(result).toEqual({ ...status.OK, body: JSON.stringify(joke) })
    })

    test('expect NO_CONTENT when index does not exist', async () => {
      mocked(dynamodb).getJokeByIndex.mockRejectedValueOnce(undefined)
      const result = await deleteByIdHandler(event)

      expect(result).toEqual(status.NO_CONTENT)
    })
  })
})
