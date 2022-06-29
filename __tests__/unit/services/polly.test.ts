import { joke, synthesizeSpeechResult } from '../__mocks__'
import { synthesizeSpeech } from '@services/polly'

const mockSynthesizeSpeech = jest.fn()
jest.mock('aws-sdk', () => ({
  Polly: jest.fn(() => ({
    synthesizeSpeech: (...args) => ({ promise: () => mockSynthesizeSpeech(...args) }),
  })),
}))

describe('polly', () => {
  beforeAll(() => {
    mockSynthesizeSpeech.mockResolvedValue(synthesizeSpeechResult)
  })

  describe('synthesizeSpeech', () => {
    test('expect text passed to synthesizeSpeech', async () => {
      await synthesizeSpeech(joke)
      expect(mockSynthesizeSpeech).toHaveBeenCalledWith({
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
