export * from 'aws-lambda'
export { Operation as PatchOperation } from 'fast-json-patch'

export interface Index {
  count: number
}

export interface Joke {
  audio?: JokeAudio
  contents: string
}

export interface JokeAudio {
  base64: string
  contentType: string
  version?: string
}

export interface JokeBatch {
  data: Joke
  id: number
}

export interface StringObject {
  [key: string]: string
}
