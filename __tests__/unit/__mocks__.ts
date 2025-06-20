import { SynthesizeSpeechOutput } from '@aws-sdk/client-polly'
import { Readable } from 'stream'

import { Index, Joke, JokeAudio, PatchOperation } from '@types'

export const index = 42

export const joke: Joke = {
  contents: 'ROFL',
}

export const jokeIndex: Index = {
  count: 50,
}

export const synthesizeSpeechOutput: SynthesizeSpeechOutput = {
  AudioStream: Buffer.from('ROFL') as unknown as Readable,
  ContentType: 'text/plain',
}

export const synthesizeSpeechResult: JokeAudio = {
  base64: Buffer.from('ROFL').toString('base64'),
  contentType: 'text/plain',
  version: '42',
}

export const jokeWithAudio: Joke = {
  ...joke,
  audio: synthesizeSpeechResult,
}

export const jsonPatchOperations: PatchOperation[] = [{ op: 'replace', path: '/contents', value: 'LOL' }]
