import { applyPatch } from 'fast-json-patch'

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Joke, PatchOperation } from '../types'
import { extractJsonPatchFromEvent, getIdFromEvent } from '../utils/events'
import { getDataByIndex, setDataByIndex } from '../services/dynamodb'
import { log, logError } from '../utils/logging'
import { mutateObjectOnJsonPatch, throwOnInvalidJsonPatch } from '../config'
import status from '../utils/status'

const applyJsonPatch = async (
  joke: Joke,
  index: number,
  patchOperations: PatchOperation[]
): Promise<APIGatewayProxyResultV2<any>> => {
  const updatedJoke = applyPatch(joke, patchOperations, throwOnInvalidJsonPatch, mutateObjectOnJsonPatch).newDocument
  try {
    await setDataByIndex(index, updatedJoke)
    return { ...status.OK, body: JSON.stringify(updatedJoke) }
  } catch (error) {
    logError(error)
    return status.INTERNAL_SERVER_ERROR
  }
}

const patchById = async (index: number, patchOperations: PatchOperation[]): Promise<APIGatewayProxyResultV2<any>> => {
  try {
    const joke = (await getDataByIndex(index)) as Joke
    try {
      return await applyJsonPatch(joke, index, patchOperations)
    } catch (error: any) {
      return { ...status.BAD_REQUEST, body: JSON.stringify({ message: error.message }) }
    }
  } catch {
    return status.NOT_FOUND
  }
}

export const patchItemHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2<any>> => {
  log('Received event', { ...event, body: undefined })
  try {
    const index = getIdFromEvent(event)
    const patchOperations = extractJsonPatchFromEvent(event)
    const result = await patchById(index, patchOperations)
    return result
  } catch (error: any) {
    return { ...status.BAD_REQUEST, body: JSON.stringify({ message: error.message }) }
  }
}
