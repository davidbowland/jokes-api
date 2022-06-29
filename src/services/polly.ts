import { Polly } from 'aws-sdk'
import { SynthesizeSpeechOutput } from 'aws-sdk/clients/polly'

import { Joke } from '../types'

const polly = new Polly({ apiVersion: '2016-06-10' })

export const synthesizeSpeech = (joke: Joke): Promise<SynthesizeSpeechOutput> =>
  polly
    .synthesizeSpeech({
      Engine: 'standard',
      LanguageCode: 'en-US',
      OutputFormat: 'ogg_vorbis',
      Text: joke.contents,
      TextType: 'text',
      VoiceId: 'Salli',
    })
    .promise()
