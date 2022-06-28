import { Joke, PatchOperation } from '@types'
import { SynthesizeSpeechOutput } from 'aws-sdk/clients/polly'

export const index = 42

export const joke: Joke = {
  contents: 'ROFL',
}

export const jsonPatchOperations: PatchOperation[] = [{ op: 'replace', path: '/contents', value: 'LOL' }]

export const synthesizeSpeechResult: SynthesizeSpeechOutput = {
  AudioStream: Buffer.from(joke.contents, 'utf-8'),
  ContentType: 'text/plain',
}
