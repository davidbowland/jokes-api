import { applyPatch } from 'fast-json-patch'

import { mutateObjectOnJsonPatch, throwOnInvalidJsonPatch } from '../config'
import { getDataByIndex, setDataByIndex } from '../services/dynamodb'
import status from '../utils/status'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, PatchOperation, Joke } from '../types'
import { extractJsonPatchFromEvent, getIdFromEvent } from '../utils/events'
import { log, logError } from '../utils/logging'

const patchById = async (index: number, patchOperations: PatchOperation[]): Promise<APIGatewayProxyResultV2<any>> => {
  const joke = (await getDataByIndex(index)) as Joke
  const updatedJoke = applyPatch(joke, patchOperations, throwOnInvalidJsonPatch, mutateObjectOnJsonPatch).newDocument
  try {
    await setDataByIndex(index, updatedJoke)
    return { ...status.OK, body: JSON.stringify(updatedJoke) }
  } catch (error) {
    logError(error)
    return status.INTERNAL_SERVER_ERROR
  }
}

export const patchItemHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2<any>> => {
  log('Received event', { ...event, body: undefined })
  try {
    const index = await getIdFromEvent(event)
    const patchOperations = await extractJsonPatchFromEvent(event)
    const result = await patchById(index, patchOperations)
    return result
  } catch (error) {
    return { ...status.BAD_REQUEST, body: JSON.stringify({ message: error }) }
  }
}
