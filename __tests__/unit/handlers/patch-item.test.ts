import { mocked } from 'jest-mock'

import { index, joke } from '../__mocks__'
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
    mocked(dynamodb).getJokeByIndex.mockResolvedValue(joke)
    mocked(events).extractJsonPatchFromEvent.mockImplementation((event) => JSON.parse(event.body))
    mocked(events).getIdFromEvent.mockReturnValue(index)
  })

  describe('patchItemHandler', () => {
    test('expect BAD_REQUEST when invalid index', async () => {
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

    test('expect NOT_FOUND when index < 1', async () => {
      mocked(events).getIdFromEvent.mockReturnValueOnce(0)
      const result = await patchItemHandler(event)

      expect(result).toEqual(expect.objectContaining(status.NOT_FOUND))
    })

    test('expect NOT_FOUND on getJokeByIndex reject', async () => {
      mocked(dynamodb).getJokeByIndex.mockRejectedValueOnce(undefined)
      const result = await patchItemHandler(event)

      expect(result).toEqual(expect.objectContaining(status.NOT_FOUND))
    })

    test('expect INTERNAL_SERVER_ERROR on setJokeByIndex reject', async () => {
      mocked(dynamodb).setJokeByIndex.mockRejectedValueOnce(undefined)
      const result = await patchItemHandler(event)

      expect(result).toEqual(status.INTERNAL_SERVER_ERROR)
    })

    test('expect setJokeByIndex called with updated object', async () => {
      await patchItemHandler(event)

      expect(mocked(dynamodb).setJokeByIndex).toHaveBeenCalledWith(index, expectedResult)
    })

    test('expect OK and body', async () => {
      const result = await patchItemHandler(event)

      expect(result).toEqual(expect.objectContaining({ ...status.OK, body: JSON.stringify(expectedResult) }))
    })
  })
})
