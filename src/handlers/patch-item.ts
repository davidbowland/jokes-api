import { applyPatch } from 'fast-json-patch'

import { mutateObjectOnJsonPatch, throwOnInvalidJsonPatch } from '../config'
import { ConditionalCheckFailedException, getJokeById, updateJoke } from '../services/dynamodb'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Joke, PatchOperation } from '../types'
import { extractJsonPatchFromEvent, getIdFromEvent } from '../utils/events'
import { log, logError } from '../utils/logging'
import status from '../utils/status'

const applyJsonPatch = async (
  joke: Joke,
  id: string,
  patchOperations: PatchOperation[],
): Promise<APIGatewayProxyResultV2<unknown>> => {
  const updatedJoke = applyPatch(joke, patchOperations, throwOnInvalidJsonPatch, mutateObjectOnJsonPatch).newDocument
  try {
    await updateJoke(id, updatedJoke, joke.version)
    const { version: _, ...responseData } = updatedJoke
    return { ...status.OK, body: JSON.stringify(responseData) }
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) {
      return { ...status.CONFLICT, body: JSON.stringify({ message: 'Version conflict' }) }
    }
    logError(error)
    return status.INTERNAL_SERVER_ERROR
  }
}

const patchById = async (id: string, patchOperations: PatchOperation[]): Promise<APIGatewayProxyResultV2<unknown>> => {
  try {
    const joke: Joke = await getJokeById(id)
    try {
      return await applyJsonPatch(joke, id, patchOperations)
    } catch (error: unknown) {
      return { ...status.BAD_REQUEST, body: JSON.stringify({ message: (error as Error).message }) }
    }
  } catch {
    return status.NOT_FOUND
  }
}

export const patchItemHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2<unknown>> => {
  log('Received event', { ...event, body: undefined })
  try {
    const id = getIdFromEvent(event)
    const patchOperations = extractJsonPatchFromEvent(event)
    const result = await patchById(id, patchOperations)
    return result
  } catch (error: unknown) {
    return { ...status.BAD_REQUEST, body: JSON.stringify({ message: (error as Error).message }) }
  }
}
