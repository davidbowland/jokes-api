import { Polly, SynthesizeSpeechCommand } from '@aws-sdk/client-polly'
import { Readable } from 'stream'

import { Joke, JokeAudio } from '../types'
import { xrayCapture } from '../utils/logging'

const polly = xrayCapture(new Polly({ apiVersion: '2016-06-10' }))

const audioStreamToBase64 = (stream: Readable): Promise<string> =>
  new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks)))
  }).then((buffer) => buffer.toString('base64'))

export const synthesizeSpeech = async (joke: Joke): Promise<JokeAudio> => {
  const command = new SynthesizeSpeechCommand({
    Engine: 'standard',
    LanguageCode: 'en-US',
    OutputFormat: 'ogg_vorbis',
    Text: joke.contents,
    TextType: 'text',
    VoiceId: 'Salli',
  })
  const { AudioStream, ContentType } = await polly.send(command)
  return {
    base64: await audioStreamToBase64(AudioStream as Readable),
    contentType: ContentType,
  }
}
