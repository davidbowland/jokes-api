export * from 'aws-lambda'
export { Operation as PatchOperation } from 'fast-json-patch'

export interface Index {
  count: number
}

export interface Joke {
  contents: string
}

export interface JokeBatch {
  data: Joke
  id: number
}

export interface StringObject {
  [key: string]: string
}
