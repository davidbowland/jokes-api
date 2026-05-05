import AJV from 'ajv/dist/jtd'

import { APIGatewayProxyEventV2, Joke, PatchOperation } from '../types'

const ajv = new AJV({ allErrors: true })

/* Jokes */

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface JokeSchema extends Omit<Joke, 'audio' | 'version'> {}

export const formatJoke = (joke: JokeSchema): Joke => {
  const jsonTypeDefinition = {
    properties: {
      contents: { type: 'string' },
    },
  }

  if (ajv.validate(jsonTypeDefinition, joke) === false) {
    throw new Error(JSON.stringify(ajv.errors))
  }

  return {
    contents: joke.contents,
    version: 1,
  }
}

/* Event */

const parseEventBody = (event: APIGatewayProxyEventV2): unknown =>
  JSON.parse(
    event.isBase64Encoded && event.body ? Buffer.from(event.body, 'base64').toString('utf8') : (event.body as string),
  )

export const extractJokeFromEvent = (event: APIGatewayProxyEventV2): Joke =>
  formatJoke(parseEventBody(event) as JokeSchema)

export const extractJsonPatchFromEvent = (event: APIGatewayProxyEventV2): PatchOperation[] =>
  parseEventBody(event) as PatchOperation[]

export const getIdFromEvent = (event: APIGatewayProxyEventV2): string => {
  const id = event.pathParameters?.id
  if (!id) {
    throw new Error('Invalid joke ID')
  }
  return id
}
