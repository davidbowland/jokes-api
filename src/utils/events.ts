import { APIGatewayProxyEventV2, Joke, PatchOperation } from '../types'

/* Jokes */

export const formatJoke = (joke: Joke): Joke => {
  if (!joke.contents) {
    throw new Error('contents missing from joke')
  }
  return {
    contents: joke.contents,
  }
}

/* Event */

const parseEventBody = (event: APIGatewayProxyEventV2): unknown =>
  JSON.parse(
    event.isBase64Encoded && event.body ? Buffer.from(event.body, 'base64').toString('utf8') : (event.body as string)
  )

export const extractJokeFromEvent = (event: APIGatewayProxyEventV2): Joke => formatJoke(parseEventBody(event) as Joke)

export const extractJsonPatchFromEvent = (event: APIGatewayProxyEventV2): PatchOperation[] =>
  parseEventBody(event) as PatchOperation[]

export const getIdFromEvent = (event: APIGatewayProxyEventV2): number => {
  const id = parseInt(event.pathParameters?.index as string, 10)
  if (isNaN(id)) {
    throw new Error('Invalid joke index')
  }
  return id
}
