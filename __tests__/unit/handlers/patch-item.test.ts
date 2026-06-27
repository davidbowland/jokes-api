import { mocked } from 'jest-mock'

import { id, joke } from '../__mocks__'
import eventJson from '@events/patch-item.json'
import { patchItemHandler } from '@handlers/patch-item'
import * as dynamodb from '@services/dynamodb'
import { APIGatewayProxyEventV2, Joke, PatchOperation } from '@types'
import * as events from '@utils/events'
import status from '@utils/status'

jest.mock('@services/dynamodb')
jest.mock('@utils/events')
jest.mock('@utils/logging')

describe('patch-item', () => {
  const event = eventJson as unknown as APIGatewayProxyEventV2
  const expectedResult = { ...joke, contents: 'LOL' } as Joke

  beforeAll(() => {
    mocked(dynamodb).getJokeById.mockResolvedValue(joke)
    mocked(events).extractJsonPatchFromEvent.mockImplementation((event) => JSON.parse(event.body))
    mocked(events).getIdFromEvent.mockReturnValue(id)
  })

  describe('patchItemHandler', () => {
    test('expect BAD_REQUEST when invalid id', async () => {
      mocked(events).getIdFromEvent.mockImplementationOnce(() => {
        throw new Error('Bad request')
      })
      const result = await patchItemHandler(event)

      expect(result).toEqual(expect.objectContaining(status.BAD_REQUEST))
    })

    test('expect BAD_REQUEST when unable to parse body', async () => {
      mocked(events).extractJsonPatchFromEvent.mockImplementationOnce(() => {
        throw new Error('Bad request')
      })
      const result = await patchItemHandler(event)

      expect(result).toEqual(expect.objectContaining(status.BAD_REQUEST))
    })

    test('expect BAD_REQUEST when patch operations are invalid', async () => {
      mocked(events).extractJsonPatchFromEvent.mockReturnValueOnce([
        { op: 'replace', path: '/fnord' },
      ] as unknown[] as PatchOperation[])
      const result = await patchItemHandler(event)

      expect(result.statusCode).toEqual(status.BAD_REQUEST.statusCode)
    })

    test('expect NOT_FOUND on getJokeById reject', async () => {
      mocked(dynamodb).getJokeById.mockRejectedValueOnce(undefined)
      const result = await patchItemHandler(event)

      expect(result).toEqual(expect.objectContaining(status.NOT_FOUND))
    })

    test('expect INTERNAL_SERVER_ERROR on updateJoke reject', async () => {
      mocked(dynamodb).updateJoke.mockRejectedValueOnce(new Error('DynamoDB error'))
      const result = await patchItemHandler(event)

      expect(result).toEqual(status.INTERNAL_SERVER_ERROR)
    })

    test('expect updateJoke called with updated object', async () => {
      await patchItemHandler(event)

      expect(mocked(dynamodb).updateJoke).toHaveBeenCalledWith(id, expectedResult, joke.version)
    })

    test('expect OK and body', async () => {
      const result = await patchItemHandler(event)
      const { version: _, ...expectedWithoutVersion } = expectedResult

      expect(result).toEqual(
        expect.objectContaining({
          ...status.OK,
          body: JSON.stringify(expectedWithoutVersion),
        }),
      )
    })
  })
})
