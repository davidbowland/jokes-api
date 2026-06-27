import { mocked } from 'jest-mock'

import { id, joke, jokeWithAudio } from '../__mocks__'
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
    mocked(dynamodb).getJokeById.mockResolvedValue(joke)
    mocked(events).getIdFromEvent.mockReturnValue(id)
  })

  describe('getByIdHandler', () => {
    test('expect BAD_REQUEST on invalid id', async () => {
      mocked(events).getIdFromEvent.mockImplementationOnce(() => {
        throw new Error('Bad request')
      })
      const result = await getByIdHandler(event)

      expect(result).toEqual(expect.objectContaining(status.BAD_REQUEST))
    })

    test('expect NOT_FOUND on getJokeById reject', async () => {
      mocked(dynamodb).getJokeById.mockRejectedValueOnce(undefined)
      const result = await getByIdHandler(event)

      expect(result).toEqual(expect.objectContaining(status.NOT_FOUND))
    })

    test('expect OK when id exists', async () => {
      const result = await getByIdHandler(event)
      const { version: _, ...jokeWithoutVersion } = joke

      expect(result).toEqual({ ...status.OK, body: JSON.stringify({ ...jokeWithoutVersion, id }) })
    })

    test('expect OK when id exists and the joke has audio', async () => {
      mocked(dynamodb).getJokeById.mockResolvedValueOnce(jokeWithAudio)
      const result = await getByIdHandler(event)
      const { version: _, ...jokeWithoutVersion } = jokeWithAudio

      expect(result).toEqual({ ...status.OK, body: JSON.stringify({ ...jokeWithoutVersion, id }) })
    })

    test("expect audio stripped from joke when audio version doesn't match polly version", async () => {
      const jokeWithMismatchedAudioVersions = {
        ...jokeWithAudio,
        audio: { ...jokeWithAudio.audio, version: 'no_match' },
      }
      mocked(dynamodb).getJokeById.mockResolvedValueOnce(jokeWithMismatchedAudioVersions)
      const result = await getByIdHandler(event)
      const { version: _, ...jokeWithoutVersion } = joke

      expect(result).toEqual({ ...status.OK, body: JSON.stringify({ ...jokeWithoutVersion, id }) })
    })
  })
})
