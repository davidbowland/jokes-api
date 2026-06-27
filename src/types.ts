export * from 'aws-lambda'
export { Operation as PatchOperation } from 'fast-json-patch'

export interface Joke {
  audio?: JokeAudio
  contents: string
  version: number
}

export interface JokeAudio {
  base64: string
  contentType: string
  version?: string
}

export interface JokeBatch {
  data: Joke
  id: string
}

export interface StringObject {
  [key: string]: string
}
