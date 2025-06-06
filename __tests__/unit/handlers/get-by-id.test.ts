import { mocked } from 'jest-mock'

import { index, joke, jokeWithAudio } from '../__mocks__'
import eventJson from '@events/get-by-id.json'
import { getByIdHandler } from '@handlers/get-by-id'
import * as dynamodb from '@services/dynamodb'
import { APIGatewayProxyEventV2 } from '@types'
import * as events from '@utils/events'
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

    test('expect NOT_FOUND when index < 1', async () => {
      mocked(events).getIdFromEvent.mockReturnValueOnce(0)
      const result = await getByIdHandler(event)

      expect(result).toEqual(expect.objectContaining(status.NOT_FOUND))
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

    test('expect OK when index exists and the joke has audio', async () => {
      mocked(dynamodb).getDataByIndex.mockResolvedValueOnce(jokeWithAudio)
      const result = await getByIdHandler(event)

      expect(result).toEqual({ ...status.OK, body: JSON.stringify({ ...jokeWithAudio, index }) })
    })

    test("expect audio stripped from joke when audio version doesn't match polly version", async () => {
      const jokeWithMismatchedAudioVersions = {
        ...jokeWithAudio,
        audio: { ...jokeWithAudio.audio, version: 'no_match' },
      }
      mocked(dynamodb).getDataByIndex.mockResolvedValueOnce(jokeWithMismatchedAudioVersions)
      const result = await getByIdHandler(event)

      expect(result).toEqual({ ...status.OK, body: JSON.stringify({ ...joke, index }) })
    })
  })
})
