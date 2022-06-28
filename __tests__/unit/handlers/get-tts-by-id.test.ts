import { mocked } from 'jest-mock'

import * as dynamodb from '@services/dynamodb'
import * as events from '@utils/events'
import * as polly from '@services/polly'
import { joke, synthesizeSpeechResult } from '../__mocks__'
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

    test('expect INTERNAL_SERVER_ERROR when synthesizeSpeech rejects', async () => {
      mocked(polly).synthesizeSpeech.mockRejectedValueOnce(undefined)
      const result = await getByIdHandler(event)
      expect(result).toEqual(expect.objectContaining(status.INTERNAL_SERVER_ERROR))
    })

    test('expect OK when index exists', async () => {
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
  })
})
