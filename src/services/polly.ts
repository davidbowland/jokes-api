import { Polly, SynthesizeSpeechCommand } from '@aws-sdk/client-polly'
import { Readable } from 'stream'

import { Joke, JokeAudio } from '../types'
import { pollyAudioVersion } from '../config'
import { xrayCapture } from '../utils/logging'

const polly = xrayCapture(new Polly({ apiVersion: '2016-06-10', region: 'us-east-1' }))

const audioStreamToBase64 = (stream: Readable): Promise<string> =>
  new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', (chunk: any) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks)))
  }).then((buffer) => buffer.toString('base64'))

export const synthesizeSpeech = async (joke: Joke): Promise<JokeAudio> => {
  const command = new SynthesizeSpeechCommand({
    Engine: 'generative',
    LanguageCode: 'en-US',
    OutputFormat: 'ogg_vorbis',
    Text: joke.contents,
    TextType: 'text',
    VoiceId: 'Ruth',
  })
  const { AudioStream, ContentType } = await polly.send(command)
  return {
    base64: await audioStreamToBase64(AudioStream as Readable),
    contentType: ContentType,
    version: pollyAudioVersion,
  }
}
