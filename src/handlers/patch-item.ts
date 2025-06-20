import { applyPatch } from 'fast-json-patch'

import { mutateObjectOnJsonPatch, throwOnInvalidJsonPatch } from '../config'
import { getJokeByIndex, setJokeByIndex } from '../services/dynamodb'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Joke, PatchOperation } from '../types'
import { extractJsonPatchFromEvent, getIdFromEvent } from '../utils/events'
import { log, logError } from '../utils/logging'
import status from '../utils/status'

const applyJsonPatch = async (
  joke: Joke,
  index: number,
  patchOperations: PatchOperation[],
): Promise<APIGatewayProxyResultV2<unknown>> => {
  const updatedJoke = applyPatch(joke, patchOperations, throwOnInvalidJsonPatch, mutateObjectOnJsonPatch).newDocument
  try {
    await setJokeByIndex(index, updatedJoke)
    return { ...status.OK, body: JSON.stringify(updatedJoke) }
  } catch (error) {
    logError(error)
    return status.INTERNAL_SERVER_ERROR
  }
}

const patchById = async (
  index: number,
  patchOperations: PatchOperation[],
): Promise<APIGatewayProxyResultV2<unknown>> => {
  try {
    const joke: Joke = await getJokeByIndex(index)
    try {
      return await applyJsonPatch(joke, index, patchOperations)
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
    const index = getIdFromEvent(event)
    if (index < 1) {
      return status.NOT_FOUND
    }

    const patchOperations = extractJsonPatchFromEvent(event)
    const result = await patchById(index, patchOperations)
    return result
  } catch (error: unknown) {
    return { ...status.BAD_REQUEST, body: JSON.stringify({ message: (error as Error).message }) }
  }
}
