import { mocked } from 'jest-mock'

import * as dynamodb from '@services/dynamodb'
import * as events from '@utils/events'
import { index, joke } from '../__mocks__'
import { APIGatewayProxyEventV2 } from '@types'
import eventJson from '@events/post-item.json'
import { postItemHandler } from '@handlers/post-item'
import status from '@utils/status'

jest.mock('@services/dynamodb')
jest.mock('@utils/events')
jest.mock('@utils/logging')

describe('post-item', () => {
  const event = eventJson as unknown as APIGatewayProxyEventV2

  beforeAll(() => {
    mocked(dynamodb).getHighestIndex.mockResolvedValue(index - 1)
    mocked(events).extractJokeFromEvent.mockReturnValue(joke)
  })

  describe('postItemHandler', () => {
    test('expect BAD_REQUEST when joke is invalid', async () => {
      mocked(events).extractJokeFromEvent.mockImplementationOnce(() => {
        throw new Error('Bad request')
      })
      const result = await postItemHandler(event)
      expect(result).toEqual(expect.objectContaining(status.BAD_REQUEST))
    })

    test('expect index passed to setDataByIndex from getHighestIndex', async () => {
      await postItemHandler(event)
      expect(mocked(dynamodb).setDataByIndex).toHaveBeenCalledWith(index, joke)
    })

    test('expect INTERNAL_SERVER_ERROR on setDataByIndex reject', async () => {
      mocked(dynamodb).setDataByIndex.mockRejectedValueOnce(undefined)
      const result = await postItemHandler(event)
      expect(result).toEqual(status.INTERNAL_SERVER_ERROR)
    })

    test('expect setHighestIndex called with new index', async () => {
      await postItemHandler(event)
      expect(mocked(dynamodb).setHighestIndex).toHaveBeenCalledWith(index)
    })

    test('expect INTERNAL_SERVER_ERROR on setHighestIndex reject', async () => {
      mocked(dynamodb).setHighestIndex.mockRejectedValueOnce(undefined)
      const result = await postItemHandler(event)
      expect(result).toEqual(status.INTERNAL_SERVER_ERROR)
    })

    test('expect CREATED and body', async () => {
      const result = await postItemHandler(event)
      expect(result).toEqual(expect.objectContaining({ ...status.CREATED, body: JSON.stringify({ ...joke, index }) }))
    })

    test('expect Location header', async () => {
      const result = await postItemHandler(event)
      expect(result).toEqual(
        expect.objectContaining({ headers: { Location: 'https://jokes-api.bowland.link/v1/jokes/42' } })
      )
    })
  })
})
