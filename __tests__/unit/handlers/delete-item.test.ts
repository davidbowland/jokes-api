import { index, joke } from '../__mocks__'
import eventJson from '@events/delete-item.json'
import { deleteByIdHandler } from '@handlers/delete-item'
import { mocked } from 'jest-mock'
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
    mocked(dynamodb).deleteDataByIndex.mockResolvedValue(undefined)
    mocked(dynamodb).getDataByIndex.mockResolvedValue(joke)
    mocked(dynamodb).getHighestIndex.mockResolvedValue(highestIndex)
    mocked(events).getIdFromEvent.mockResolvedValue(index)
  })

  describe('deleteByIdHandler', () => {
    test('expect BAD_REQUEST on invalid index', async () => {
      mocked(events).getIdFromEvent.mockRejectedValueOnce('Bad request')
      const result = await deleteByIdHandler(event)
      expect(result).toEqual(expect.objectContaining(status.BAD_REQUEST))
    })

    test('expect INTERNAL_SERVER_ERROR on deleteDataByIndex reject', async () => {
      mocked(dynamodb).deleteDataByIndex.mockRejectedValueOnce(undefined)
      const result = await deleteByIdHandler(event)
      expect(result).toEqual(expect.objectContaining(status.INTERNAL_SERVER_ERROR))
    })

    test('expect NO_CONTENT when index is higher than max index', async () => {
      mocked(dynamodb).getHighestIndex.mockResolvedValueOnce(index - 2)
      const result = await deleteByIdHandler(event)
      expect(result).toEqual(expect.objectContaining(status.NO_CONTENT))
    })

    test('expect setDataByIndex not called when index == highestIndex', async () => {
      mocked(dynamodb).getHighestIndex.mockResolvedValueOnce(index)
      await deleteByIdHandler(event)
      expect(mocked(dynamodb).setDataByIndex).toHaveBeenCalledTimes(0)
    })

    test('expect setDataByIndex called with joke', async () => {
      await deleteByIdHandler(event)
      expect(mocked(dynamodb).setDataByIndex).toHaveBeenCalledWith(index, joke)
    })

    test('expect deleteDataByIndex called with highest index', async () => {
      await deleteByIdHandler(event)
      expect(mocked(dynamodb).deleteDataByIndex).toHaveBeenCalledWith(highestIndex)
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
      mocked(dynamodb).getDataByIndex.mockRejectedValueOnce(undefined)
      const result = await deleteByIdHandler(event)
      expect(result).toEqual(expect.objectContaining(status.NO_CONTENT))
    })
  })
})
