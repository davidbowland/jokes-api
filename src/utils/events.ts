import { APIGatewayEvent, Joke, PatchOperation } from '../types'

/* Jokes */

const isValidJoke = (joke: Joke): Promise<Joke> =>
  Promise.resolve()
    .then(() => joke.contents ?? Promise.reject('contents missing from joke'))
    .then(() => joke)

export const formatJoke = (joke: Joke): Promise<Joke> =>
  isValidJoke(joke).then(() => ({
    contents: joke.contents,
  }))

/* Event */

const parseEventBody = (event: APIGatewayEvent): unknown =>
  JSON.parse(
    event.isBase64Encoded && event.body ? Buffer.from(event.body, 'base64').toString('utf8') : (event.body as string)
  )

export const extractJokeFromEvent = (event: APIGatewayEvent): Promise<Joke> =>
  Promise.resolve(parseEventBody(event)).then(formatJoke)

export const extractJsonPatchFromEvent = (event: APIGatewayEvent): Promise<PatchOperation[]> =>
  Promise.resolve(parseEventBody(event) as PatchOperation[])

export const getIdFromEvent = (event: APIGatewayEvent): Promise<number> =>
  Promise.resolve(parseInt(event.pathParameters?.index, 10) || Promise.reject('Invalid joke index'))
