import { APIGatewayProxyEventV2, Joke, PatchOperation } from '../types'

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

const parseEventBody = (event: APIGatewayProxyEventV2): unknown =>
  JSON.parse(
    event.isBase64Encoded && event.body ? Buffer.from(event.body, 'base64').toString('utf8') : (event.body as string)
  )

export const extractJokeFromEvent = (event: APIGatewayProxyEventV2): Promise<Joke> =>
  Promise.resolve(parseEventBody(event)).then((joke) => formatJoke(joke as Joke))

export const extractJsonPatchFromEvent = (event: APIGatewayProxyEventV2): Promise<PatchOperation[]> =>
  Promise.resolve(parseEventBody(event) as PatchOperation[])

export const getIdFromEvent = (event: APIGatewayProxyEventV2): Promise<number> =>
  Promise.resolve(parseInt(event.pathParameters?.index, 10)).then((value) =>
    isNaN(value) ? Promise.reject('Invalid joke index') : value
  )
