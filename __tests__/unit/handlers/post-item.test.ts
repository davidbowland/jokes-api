import { mocked } from 'jest-mock'

import { id, joke } from '../__mocks__'
import eventJson from '@events/post-item.json'
import { postItemHandler } from '@handlers/post-item'
import * as dynamodb from '@services/dynamodb'
import { APIGatewayProxyEventV2 } from '@types'
import * as events from '@utils/events'
import * as idGenerator from '@utils/id-generator'
import * as logging from '@utils/logging'
import status from '@utils/status'

jest.mock('@services/dynamodb')
jest.mock('@utils/events')
jest.mock('@utils/id-generator')
jest.mock('@utils/logging')

describe('post-item', () => {
  const event = eventJson as unknown as APIGatewayProxyEventV2

  beforeAll(() => {
    mocked(events).extractJokeFromEvent.mockReturnValue(joke)
    mocked(idGenerator).generateId.mockReturnValue(id)
    mocked(logging).extractRequestError.mockImplementation((str) => ({ message: str }))
  })

  describe('postItemHandler', () => {
    test('expect BAD_REQUEST when joke is invalid', async () => {
      mocked(events).extractJokeFromEvent.mockImplementationOnce(() => {
        throw new Error('Bad request')
      })
      const result = await postItemHandler(event)

      expect(result).toEqual(expect.objectContaining(status.BAD_REQUEST))
    })

    test('expect putJoke called with generated id and joke', async () => {
      await postItemHandler(event)

      expect(mocked(dynamodb).putJoke).toHaveBeenCalledWith(id, joke)
    })

    test('expect INTERNAL_SERVER_ERROR on putJoke reject', async () => {
      mocked(dynamodb).putJoke.mockRejectedValueOnce(new Error('DynamoDB error'))
      const result = await postItemHandler(event)

      expect(result).toEqual(status.INTERNAL_SERVER_ERROR)
    })

    test('expect retry on ConditionalCheckFailedException', async () => {
      mocked(dynamodb).putJoke.mockRejectedValueOnce(
        new dynamodb.ConditionalCheckFailedException({ message: '', $metadata: {} }),
      )
      const result = await postItemHandler(event)

      expect(mocked(dynamodb).putJoke).toHaveBeenCalledTimes(2)
      expect(result).toEqual(expect.objectContaining(status.CREATED))
    })

    test('expect addToRoster called with new id', async () => {
      await postItemHandler(event)

      expect(mocked(dynamodb).addToRoster).toHaveBeenCalledWith(id)
    })

    test('expect CREATED and body', async () => {
      const result = await postItemHandler(event)
      const { version: _, ...jokeWithoutVersion } = joke

      expect(result).toEqual(
        expect.objectContaining({ ...status.CREATED, body: JSON.stringify({ ...jokeWithoutVersion, id }) }),
      )
    })

    test('expect Location header', async () => {
      const result = await postItemHandler(event)

      expect(result).toEqual(
        expect.objectContaining({ headers: { Location: `https://jokes-api.bowland.link/v1/jokes/${id}` } }),
      )
    })
  })
})
