import { mocked } from 'jest-mock'

import { id, joke } from '../__mocks__'
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

  beforeAll(() => {
    mocked(dynamodb).getJokeById.mockResolvedValue(joke)
    mocked(events).getIdFromEvent.mockReturnValue(id)
  })

  describe('deleteByIdHandler', () => {
    test('expect BAD_REQUEST on invalid id', async () => {
      mocked(events).getIdFromEvent.mockImplementationOnce(() => {
        throw new Error('Bad request')
      })
      const result = await deleteByIdHandler(event)

      expect(result).toEqual(expect.objectContaining(status.BAD_REQUEST))
    })

    test('expect INTERNAL_SERVER_ERROR on deleteJoke reject', async () => {
      mocked(dynamodb).deleteJoke.mockRejectedValueOnce(undefined)
      const result = await deleteByIdHandler(event)

      expect(result).toEqual(status.INTERNAL_SERVER_ERROR)
    })

    test('expect deleteJoke called with id', async () => {
      await deleteByIdHandler(event)

      expect(mocked(dynamodb).deleteJoke).toHaveBeenCalledWith(id)
    })

    test('expect removeFromRoster called with id', async () => {
      await deleteByIdHandler(event)

      expect(mocked(dynamodb).removeFromRoster).toHaveBeenCalledWith(id)
    })

    test('expect OK when id exists', async () => {
      const result = await deleteByIdHandler(event)

      expect(result).toEqual({ ...status.OK, body: JSON.stringify(joke) })
    })

    test('expect NO_CONTENT when id does not exist', async () => {
      mocked(dynamodb).getJokeById.mockRejectedValueOnce(undefined)
      const result = await deleteByIdHandler(event)

      expect(result).toEqual(status.NO_CONTENT)
    })
  })
})
