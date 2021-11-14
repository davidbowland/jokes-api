import { Operation } from 'fast-json-patch'

import { jokeTableReferenceIndex } from '@v1-jokes-handler/config'
import { deleteDataByIndex, getDataByIndex, Joke, ReferenceInfo, setDataByIndex } from '@v1-jokes-handler/dynamodb'
import { getPayloadFromEvent } from '@v1-jokes-handler/event-processing'
import { APIGatewayEvent, APIGatewayEventResult } from '@v1-jokes-handler/index'
import status from '@v1-jokes-handler/status'
import * as v1JokesById from '@v1-jokes-handler/v1-jokes-by-id'
import { deleteById, getById, patchById, processById, putById } from '@v1-jokes-handler/v1-jokes-by-id'

jest.mock('@v1-jokes-handler/dynamodb')
jest.mock('@v1-jokes-handler/error-handling', () => ({
  handleErrorWithDefault: (value) => () => value,
}))
jest.mock('@v1-jokes-handler/event-processing')
jest.mock('@v1-jokes-handler/index')

describe('v1-jokes-by-id', () => {
  const referenceInfo: ReferenceInfo = { count: 2 }
  const joke: Joke = { joke: 'my fashion sense' }
  const jokeTable: { [key: number]: Joke | ReferenceInfo } = {
    [jokeTableReferenceIndex]: referenceInfo,
    1: joke,
    2: { joke: 'congress' },
  }
  const finalIndex = referenceInfo.count
  const patchJokeOneToTwo: Operation[] = [
    {
      op: 'replace',
      path: '/joke',
      value: jokeTable[2].joke,
    },
  ]

  beforeAll(() => {
    ;(getDataByIndex as jest.Mock).mockImplementation(async (key: number) => jokeTable[key] ?? {})
  })

  describe('getById', () => {
    test('expect status.OK with a body', async () => {
      const index = 1
      const result = await getById(index)
      expect(result).toEqual(expect.objectContaining(status.OK))
      expect(result.body).toBeDefined()
    })

    test.each([1, 2])('expect correct joke when requested by id (result=%s)', async (index: number) => {
      const result = await getById(index)
      expect(JSON.parse(result.body as string)).toEqual(jokeTable[index])
    })

    test('expect status.NOT_FOUND when no joke is found', async () => {
      const index = 4
      ;(getDataByIndex as jest.Mock).mockResolvedValueOnce({})

      const result = await getById(index)
      expect(result).toEqual(expect.objectContaining(status.NOT_FOUND))
    })
  })

  describe('patchById', () => {
    const index = 1

    beforeAll(() => {
      ;(setDataByIndex as jest.Mock).mockImplementation(async (key: number, data: Joke | ReferenceInfo) => {
        if (
          (key === jokeTableReferenceIndex && typeof (data as ReferenceInfo).count === 'undefined') ||
          (key !== jokeTableReferenceIndex && typeof (data as Joke).joke === 'undefined')
        ) {
          throw `setDataByIndex called with invalid index ${key} and data ${JSON.stringify(data)}`
        }
      })
    })

    test('expect status.OK and body when data is valid', async () => {
      const result = await patchById(index, patchJokeOneToTwo)
      expect(result).toEqual(expect.objectContaining(status.OK))
      expect(JSON.parse(result.body)).toEqual({ id: index, ...jokeTable[2] })
    })

    test('expect setDataByIndex called with updated joke', async () => {
      await patchById(index, patchJokeOneToTwo)
      expect(setDataByIndex).toHaveBeenCalledWith(index, jokeTable[2])
    })

    test.each([[{ op: 'none' }], { joke: 'something funny' }])(
      'expect status.BAD_REQUEST when data is invalid (data=%s)',
      async (data: unknown) => {
        const result = await patchById(index, data)
        expect(result).toEqual(expect.objectContaining(status.BAD_REQUEST))
      }
    )
  })

  describe('putById', () => {
    const index = 1

    beforeAll(() => {
      ;(setDataByIndex as jest.Mock).mockImplementation(async (key: number, data: Joke | ReferenceInfo) => {
        if (
          (key === jokeTableReferenceIndex && typeof (data as ReferenceInfo).count === 'undefined') ||
          (key !== jokeTableReferenceIndex && typeof (data as Joke).joke === 'undefined')
        ) {
          throw `setDataByIndex called with invalid index ${key} and data ${JSON.stringify(data)}`
        }
      })
    })

    test('expect status.OK and body when data is valid', async () => {
      const result = await putById(index, joke)
      expect(result).toEqual(expect.objectContaining(status.OK))
      expect(JSON.parse(result.body)).toEqual({ id: index, ...joke })
    })

    test('expect setDataByIndex called with passed data', async () => {
      await putById(index, joke)
      expect(setDataByIndex).toHaveBeenCalledWith(index, joke)
    })

    test.each([{}, { joke: '' }])(
      'expect status.BAD_REQUEST when data is invalid (data=%s)',
      async (data: Record<string, unknown>) => {
        const result = await putById(index, data)
        expect(result).toEqual(expect.objectContaining(status.BAD_REQUEST))
      }
    )
  })

  describe('deleteById', () => {
    const index = 1

    beforeAll(() => {
      ;(setDataByIndex as jest.Mock).mockImplementation(async (key: number, data: Joke | ReferenceInfo) => {
        if (
          (key === jokeTableReferenceIndex && typeof (data as ReferenceInfo).count === 'undefined') ||
          (key !== jokeTableReferenceIndex && typeof (data as Joke).joke === 'undefined')
        ) {
          throw `setDataByIndex called with invalid index ${key} and data ${JSON.stringify(data)}`
        } else if (key === jokeTableReferenceIndex && (data as ReferenceInfo).count !== referenceInfo.count - 1) {
          throw `setDataByIndex in deleteById ${
            (data as ReferenceInfo).count
          } expected to be one less than current value ${referenceInfo.count}`
        }
      })
      ;(deleteDataByIndex as jest.Mock).mockImplementation(async (key: number) => {
        if (key !== referenceInfo.count) {
          throw `deleteDataByIndex tried to delete ${key} but is expected to only delete the final index ${referenceInfo.count}`
        }
      })
    })

    test('expect status.NO_CONTENT', async () => {
      const result = await deleteById(index, referenceInfo)
      expect(result).toEqual(expect.objectContaining(status.NO_CONTENT))
    })

    test('expect only delete of final index when deleting final index', async () => {
      await deleteById(finalIndex, referenceInfo)
      expect(deleteDataByIndex).toHaveBeenCalledWith(finalIndex)
      expect(setDataByIndex).toHaveBeenCalledWith(
        jokeTableReferenceIndex,
        expect.objectContaining({ count: finalIndex - 1 })
      )
    })

    test('expect swap of final index and delete index when not deleting final index', async () => {
      await deleteById(index, referenceInfo)
      expect(setDataByIndex).toHaveBeenCalledWith(index, jokeTable[finalIndex])
      expect(deleteDataByIndex).toHaveBeenCalledWith(finalIndex)
    })
  })

  describe('processById', () => {
    const index = 1
    const event = {
      pathParameters: { jokeId: `${index}` },
      httpMethod: 'GET',
      body: JSON.stringify(joke),
    } as unknown as APIGatewayEvent
    const getById = jest.spyOn(v1JokesById, 'getById')
    const patchById = jest.spyOn(v1JokesById, 'patchById')
    const putById = jest.spyOn(v1JokesById, 'putById')
    const deleteById = jest.spyOn(v1JokesById, 'deleteById')
    const getReturnValue = { value: 'unique-getById-value025' } as unknown as APIGatewayEventResult
    const patchReturnValue = { value: 'unique-patchById-value601' } as unknown as APIGatewayEventResult
    const putReturnValue = { value: 'unique-putById-value389' } as unknown as APIGatewayEventResult
    const deleteReturnValue = { value: 'unique-deleteById-value714' } as unknown as APIGatewayEventResult

    beforeAll(() => {
      ;(getPayloadFromEvent as jest.Mock).mockImplementation(async (event: APIGatewayEventResult) =>
        JSON.parse(event.body)
      )

      getById.mockResolvedValue(getReturnValue)
      patchById.mockImplementation((_: unknown, jsonPatch: unknown) => {
        if (JSON.stringify(jsonPatch) !== JSON.stringify(patchJokeOneToTwo)) {
          throw `patchById received jsonPatch ${JSON.stringify(jsonPatch)} but expected ${JSON.stringify(
            patchJokeOneToTwo
          )}`
        }
        return patchReturnValue
      })
      putById.mockImplementation((_: unknown, jokeInfo: Joke) => {
        if (jokeInfo.joke !== joke.joke) {
          throw `putById received joke ${JSON.stringify(jokeInfo)} but expected ${JSON.stringify(joke)}`
        }
        return putReturnValue
      })
      deleteById.mockImplementation((_: unknown, deleteReferenceInfo: ReferenceInfo) => {
        if (deleteReferenceInfo.count !== referenceInfo.count) {
          throw `deleteById received info ${JSON.stringify(deleteReferenceInfo)} but expected ${JSON.stringify(
            referenceInfo
          )}`
        }
        return deleteReturnValue
      })
    })

    test('expect GET to invoke getById', async () => {
      const httpMethod = 'GET'
      const tempEvent = { ...event, httpMethod } as unknown as APIGatewayEvent

      const result = await processById(referenceInfo, tempEvent)
      expect(result).toEqual(getReturnValue)
      expect(getById).toHaveBeenCalledWith(index)
    })

    test('expect PATCH to invoke patchById', async () => {
      const httpMethod = 'PATCH'
      const body = JSON.stringify(patchJokeOneToTwo)
      const tempEvent = { ...event, httpMethod, body } as unknown as APIGatewayEvent

      const result = await processById(referenceInfo, tempEvent)
      expect(result).toEqual(patchReturnValue)
      expect(patchById).toHaveBeenCalledWith(index, patchJokeOneToTwo)
    })

    test('expect PUT to invoke putById', async () => {
      const httpMethod = 'PUT'
      const tempEvent = { ...event, httpMethod } as unknown as APIGatewayEvent

      const result = await processById(referenceInfo, tempEvent)
      expect(result).toEqual(putReturnValue)
      expect(putById).toHaveBeenCalledWith(index, joke)
    })

    test('expect DELETE to invoke deleteById', async () => {
      const httpMethod = 'DELETE'
      const tempEvent = { ...event, httpMethod } as unknown as APIGatewayEvent

      const result = await processById(referenceInfo, tempEvent)
      expect(result).toEqual(deleteReturnValue)
      expect(deleteById).toHaveBeenCalledWith(index, referenceInfo)
    })

    test('expect status.BAD_REQUEST when httpMethod is unknown', async () => {
      const tempEvent = { ...event, httpMethod: 'FNORD' } as unknown as APIGatewayEvent
      const result = await processById(referenceInfo, tempEvent)
      expect(result).toEqual(expect.objectContaining(status.BAD_REQUEST))
    })

    test.each(['test', '-3', `${jokeTableReferenceIndex}`])(
      'expect status.BAD_REQUEST when jokeId is bad, less than zero, or the reference index',
      async (jokeId: string) => {
        const tempEvent = { ...event, pathParameters: { jokeId } } as unknown as APIGatewayEvent
        const result = await processById(referenceInfo, tempEvent)
        expect(result).toEqual(expect.objectContaining(status.BAD_REQUEST))
      }
    )

    test('expect status.BAD_REQUEST when path parameters are omitted', async () => {
      const tempEvent = {} as unknown as APIGatewayEvent
      const result = await processById(referenceInfo, tempEvent)
      expect(result).toEqual(expect.objectContaining(status.BAD_REQUEST))
    })

    test('expect status.NOT_FOUND when jokeId is greater than the final index', async () => {
      const tempEvent = { ...event, pathParameters: { jokeId: `${finalIndex + 1}` } } as unknown as APIGatewayEvent
      const result = await processById(referenceInfo, tempEvent)
      expect(result).toEqual(expect.objectContaining(status.NOT_FOUND))
    })
  })
})
