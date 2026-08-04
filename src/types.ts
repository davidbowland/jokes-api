export * from 'aws-lambda'
export { Operation as PatchOperation } from 'fast-json-patch'

export interface Joke {
  audio?: JokeAudio
  contents: string
  version: number
}

export interface JokeAudio {
  base64: string
  // Polly's SynthesizeSpeech response declares ContentType as optional, so this can be absent
  contentType?: string
  version?: string
}

export interface JokeBatch {
  data: Joke
  id: string
}

export interface StringObject {
  [key: string]: string
}
