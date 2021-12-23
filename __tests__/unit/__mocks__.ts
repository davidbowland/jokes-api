import { Joke, PatchOperation } from '@types'

export const index = 42

export const joke: Joke = {
  contents: 'ROFL',
}

export const jsonPatchOperations: PatchOperation[] = [{ op: 'replace', path: '/contents', value: 'LOL' }]
