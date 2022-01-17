import { applyPatch } from 'fast-json-patch'

import { mutateObjectOnJsonPatch, throwOnInvalidJsonPatch } from '../config'
import { getDataByIndex, setDataByIndex } from '../services/dynamodb'
import status from '../utils/status'
import { APIGatewayEvent, APIGatewayProxyResult, PatchOperation, Joke } from '../types'
import { extractJsonPatchFromEvent, getCorsHeaders, getIdFromEvent } from '../utils/events'
import { log, logError } from '../utils/logging'

const patchById = async (index: number, patchOperations: PatchOperation[]): Promise<APIGatewayProxyResult> => {
  const joke = (await getDataByIndex(index)) as Joke
  const updatedJoke = applyPatch(joke, patchOperations, throwOnInvalidJsonPatch, mutateObjectOnJsonPatch).newDocument
  try {
    await setDataByIndex(index, joke)
    return { ...status.OK, body: JSON.stringify(updatedJoke) }
  } catch (error) {
    logError(error)
    return status.INTERNAL_SERVER_ERROR
  }
}

export const patchItemHandler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  log('Received event', { ...event, body: undefined })
  try {
    const index = await getIdFromEvent(event)
    const patchOperations = await extractJsonPatchFromEvent(event)
    const result = await patchById(index, patchOperations)
    return { ...getCorsHeaders(event), ...result }
  } catch (error) {
    return { ...getCorsHeaders(event), ...status.BAD_REQUEST, body: JSON.stringify({ message: error }) }
  }
}
