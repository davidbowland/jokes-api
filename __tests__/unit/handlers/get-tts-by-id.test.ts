import { mocked } from 'jest-mock'

import * as dynamodb from '@services/dynamodb'
import * as events from '@utils/events'
import * as polly from '@services/polly'
import { index, joke, jokeWithAudio, synthesizeSpeechResult } from '../__mocks__'
import { APIGatewayProxyEventV2 } from '@types'
import eventJson from '@events/get-tts-by-id.json'
import { getByIdHandler } from '@handlers/get-tts-by-id'
import status from '@utils/status'

jest.mock('@services/dynamodb')
jest.mock('@services/polly')
jest.mock('@utils/events')
jest.mock('@utils/logging')

describe('get-tts-by-id', () => {
  const event = eventJson as unknown as APIGatewayProxyEventV2

  beforeAll(() => {
    mocked(dynamodb).getDataByIndex.mockResolvedValue(joke)
    mocked(events).getIdFromEvent.mockReturnValue(index)
    mocked(polly).synthesizeSpeech.mockResolvedValue(synthesizeSpeechResult)
  })

  describe('getByIdHandler', () => {
    test('expect BAD_REQUEST on invalid index', async () => {
      mocked(events).getIdFromEvent.mockImplementationOnce(() => {
        throw new Error('Bad request')
      })
      const result = await getByIdHandler(event)

      expect(result).toEqual(expect.objectContaining(status.BAD_REQUEST))
    })

    test('expect NOT_FOUND when getDataByIndex rejects', async () => {
      mocked(dynamodb).getDataByIndex.mockRejectedValueOnce(undefined)
      const result = await getByIdHandler(event)

      expect(result).toEqual(expect.objectContaining(status.NOT_FOUND))
    })

    test('expect OK and result when audio exists', async () => {
      mocked(dynamodb).getDataByIndex.mockResolvedValueOnce(jokeWithAudio)
      const result = await getByIdHandler(event)

      expect(mocked(polly).synthesizeSpeech).toHaveBeenCalledTimes(0)
      expect(result).toEqual(
        expect.objectContaining({
          ...status.OK,
          headers: {
            'content-type': 'text/plain',
          },
          isBase64Encoded: true,
        })
      )
      expect(Buffer.from(result.body, 'base64').toString('utf8')).toEqual(joke.contents)
    })

    test('expect INTERNAL_SERVER_ERROR when synthesizeSpeech rejects', async () => {
      mocked(polly).synthesizeSpeech.mockRejectedValueOnce(undefined)
      const result = await getByIdHandler(event)

      expect(result).toEqual(status.INTERNAL_SERVER_ERROR)
    })

    test('expect OK when no audio exists', async () => {
      const result = await getByIdHandler(event)

      expect(result).toEqual(
        expect.objectContaining({
          ...status.OK,
          headers: {
            'content-type': 'text/plain',
          },
          isBase64Encoded: true,
        })
      )
      expect(Buffer.from(result.body, 'base64').toString('utf8')).toEqual(joke.contents)
    })

    test('expect setDataByIndex invoked when no audio exists', async () => {
      await getByIdHandler(event)

      expect(mocked(dynamodb).setDataByIndex).toHaveBeenCalledWith(index, jokeWithAudio)
    })
  })
})
