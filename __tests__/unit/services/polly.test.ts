import { joke, synthesizeSpeechOutput, synthesizeSpeechResult } from '../__mocks__'
import { synthesizeSpeech } from '@services/polly'

const mockSend = jest.fn()
const mockStream = jest.fn()
jest.mock('@aws-sdk/client-polly', () => ({
  Polly: jest.fn(() => ({
    send: (...args) => mockSend(...args),
  })),
  SynthesizeSpeechCommand: jest.fn().mockImplementation((x) => x),
}))
jest.mock('@utils/logging', () => ({
  xrayCapture: jest.fn().mockImplementation((x) => x),
}))

describe('polly', () => {
  beforeAll(() => {
    const AudioStream = {
      on: (...args) => mockStream(...args),
    }
    const speechOutputWithAudio = {
      ...synthesizeSpeechOutput,
      AudioStream,
    }
    mockSend.mockResolvedValue(speechOutputWithAudio)
    mockStream.mockImplementation((action, fn) => {
      if (action === 'data') {
        fn(Buffer.from(joke.contents))
      } else if (action === 'end') {
        fn()
      }
    })
  })

  describe('synthesizeSpeech', () => {
    test('expect text passed to synthesizeSpeech', async () => {
      await synthesizeSpeech(joke)

      expect(mockSend).toHaveBeenCalledWith({
        Engine: 'standard',
        LanguageCode: 'en-US',
        OutputFormat: 'ogg_vorbis',
        Text: joke.contents,
        TextType: 'text',
        VoiceId: 'Salli',
      })
    })

    test('expect result returned from synthesizeSpeech', async () => {
      const result = await synthesizeSpeech(joke)

      expect(result).toEqual(synthesizeSpeechResult)
    })
  })
})
