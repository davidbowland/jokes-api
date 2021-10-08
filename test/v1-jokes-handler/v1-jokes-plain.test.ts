import { fetchCountMaximum, jokeTableReferenceIndex } from '@v1-jokes-handler/config'
import { getDataByIndex, getDataByIndexBatch, Joke, ReferenceInfo, setDataByIndex } from '@v1-jokes-handler/dynamodb'
import { getIntFromParameter, getPayloadFromEvent, Options } from '@v1-jokes-handler/event-processing'
import { APIGatewayEvent, APIGatewayEventResult } from '@v1-jokes-handler/index'
import status from '@v1-jokes-handler/status'
import * as v1JokesPlain from '@v1-jokes-handler/v1-jokes-plain'
import { getPlain, postPlain, processPlain } from '@v1-jokes-handler/v1-jokes-plain'

jest.mock('@v1-jokes-handler/dynamodb')
jest.mock('@v1-jokes-handler/error-handling', () => ({
  handleErrorWithDefault: (value) => () => value,
}))
jest.mock('@v1-jokes-handler/event-processing')
jest.mock('@v1-jokes-handler/index')

describe('v1-jokes-plain', () => {
  const referenceInfo: ReferenceInfo = { count: 2 }
  const joke: Joke = { joke: 'my fashion sense' }
  const jokeTable: { [key: number]: Joke | ReferenceInfo } = {
    [jokeTableReferenceIndex]: referenceInfo,
    1: joke,
    2: { joke: 'congress' },
  }
  const finalIndex = referenceInfo.count

  beforeAll(() => {
    ;(getDataByIndex as jest.Mock).mockImplementation(async (key: number) => {
      return jokeTable[key] ?? {}
    })
  })

  describe('getPlain', () => {
    const offset = 1
    const limit = 10

    beforeAll(() => {
      ;(getDataByIndexBatch as jest.Mock).mockImplementation(async (keys: number[]) => {
        return keys.reduce((result, index) => {
          result[index] = jokeTable[index] as Joke
          return result
        }, {} as { [key: number]: Joke })
      })
    })

    test('expect status.OK with a body', async () => {
      const result = await getPlain(referenceInfo, offset, limit)
      expect(result).toEqual(expect.objectContaining(status.OK))
      expect(result.body).toBeDefined()
    })

    test.each([
      [1, 1, ['1']],
      [1, 2, ['1', '2']],
      [2, 2, ['2']],
    ])(
      'expect correct jokes given offset %s and limit %s (expectedResult=%s)',
      async (tempOffset: number, tempLimit: number, expectedResult: string[]) => {
        const result = await getPlain(referenceInfo, tempOffset, tempLimit)
        expect(Object.keys(JSON.parse(result.body as string))).toEqual(expectedResult)
      }
    )

    test('expect status.NOT_FOUND when no joke is found at the offset', async () => {
      const tempOffset = referenceInfo.count + 1
      const result = await getPlain(referenceInfo, tempOffset, limit)
      expect(result).toEqual(expect.objectContaining(status.NOT_FOUND))
    })

    test.each([jokeTableReferenceIndex, -3])(
      'expect status.BAD_REQUEST when offset is bad %s',
      async (tempOffset: number) => {
        const result = await getPlain(referenceInfo, tempOffset, limit)
        expect(result).toEqual(expect.objectContaining(status.BAD_REQUEST))
      }
    )

    test.each([-1, 0])('expect status.BAD_REQUEST when limit is bad %s', async (tempLimit: number) => {
      const result = await getPlain(referenceInfo, offset, tempLimit)
      expect(result).toEqual(expect.objectContaining(status.BAD_REQUEST))
    })
  })

  describe('postPlain', () => {
    beforeAll(() => {
      ;(setDataByIndex as jest.Mock).mockImplementation(async (key: number, data: Joke | ReferenceInfo) => {
        if (key === jokeTableReferenceIndex) {
          if ((data as ReferenceInfo).count != finalIndex + 1) {
            throw `setDataByIndex must write reference info ${JSON.stringify(data)} with new count ${finalIndex + 1}`
          }
        } else {
          if ((data as Joke).joke != joke.joke) {
            throw `setDataByIndex was invoked with a different joke ${JSON.stringify(
              data
            )} than expected ${JSON.stringify(joke)}`
          }
        }
      })
    })

    test('expect status.CREATED when data is valid', async () => {
      const result = await postPlain(referenceInfo, joke)
      expect(result).toEqual(expect.objectContaining(status.CREATED))
    })

    test('expect setDataByIndex called with passed data', async () => {
      const newIndex = finalIndex + 1
      await postPlain(referenceInfo, joke)
      expect(setDataByIndex).toHaveBeenCalledWith(jokeTableReferenceIndex, { count: newIndex })
      expect(setDataByIndex).toHaveBeenCalledWith(newIndex, joke)
    })

    test.each([{}, { joke: '' }])(
      'expect status.BAD_REQUEST when data is invalid (data=%s)',
      async (data: Record<string, unknown>) => {
        const result = await postPlain(referenceInfo, data)
        expect(result).toEqual(expect.objectContaining(status.BAD_REQUEST))
      }
    )
  })

  describe('processPlain', () => {
    const event = { httpMethod: 'GET' } as unknown as APIGatewayEvent
    const getPlain = jest.spyOn(v1JokesPlain, 'getPlain')
    const postPlain = jest.spyOn(v1JokesPlain, 'postPlain')
    const getReturnValue = { value: 'unique-getPlain-value4387' } as unknown as APIGatewayEventResult
    const postReturnValue = { value: 'unique-postPlain-value0192' } as unknown as APIGatewayEventResult

    const offset = 1
    const limit = 10

    beforeAll(() => {
      ;(getPayloadFromEvent as jest.Mock).mockResolvedValue(joke)
      ;(getIntFromParameter as jest.Mock).mockImplementation(
        async (event: APIGatewayEvent, parameterName: string, options?: Options) => {
          if (parameterName === 'offset') {
            if (options?.default !== 1) {
              throw `getIntFromParameter for ${parameterName} didn't have expected default value 1 (default=${options?.default})`
            }
            return offset
          } else if (parameterName === 'limit') {
            if (options?.default !== fetchCountMaximum) {
              throw `getIntFromParameter for ${parameterName} didn't have expected default value 10 (default=${options?.default})`
            }
            return limit
          }
          throw `getIntFromParameter expected paramterName offset or limit (received=${parameterName})`
        }
      )

      getPlain.mockImplementation(async (tempReferenceInfo: ReferenceInfo, tempOffset: number, tempLimit: number) => {
        if (tempReferenceInfo.count !== referenceInfo.count) {
          throw `getPlain received referenceInfo ${JSON.stringify(tempReferenceInfo)} but expected ${JSON.stringify(
            referenceInfo
          )}`
        } else if (tempOffset === jokeTableReferenceIndex) {
          throw `getPlain received offset ${tempOffset} that is the reference index ${jokeTableReferenceIndex}`
        } else if (tempLimit < 1) {
          throw `getPlain received bad limit ${tempLimit}`
        }
        return getReturnValue
      })
      postPlain.mockImplementation(async (tempReferenceInfo: ReferenceInfo, jokeInfo: Joke) => {
        if (tempReferenceInfo.count !== referenceInfo.count) {
          throw `postPlain received a referenceInfo ${JSON.stringify(tempReferenceInfo)} but expected ${JSON.stringify(
            referenceInfo
          )}`
        } else if (jokeInfo.joke !== joke.joke) {
          throw `postPlain received joke ${JSON.stringify(jokeInfo)} but expected ${JSON.stringify(joke)}`
        }
        return postReturnValue
      })
    })

    test('expect GET to invoke getPlain', async () => {
      const httpMethod = 'GET'
      const tempEvent = { ...event, httpMethod } as unknown as APIGatewayEvent

      const result = await processPlain(tempEvent)
      expect(result).toEqual(getReturnValue)
      expect(getPlain).toHaveBeenCalledTimes(1)
    })

    test('expect POST to invoke putById', async () => {
      const httpMethod = 'POST'
      const tempEvent = { ...event, httpMethod } as unknown as APIGatewayEvent

      const result = await processPlain(tempEvent)
      expect(result).toEqual(postReturnValue)
      expect(postPlain).toHaveBeenCalledTimes(1)
    })

    test('expect status.BAD_REQUEST when httpMethod is unknown', async () => {
      const tempEvent = { ...event, httpMethod: 'FNORD' } as unknown as APIGatewayEvent
      const result = await processPlain(tempEvent)
      expect(result).toEqual(expect.objectContaining(status.BAD_REQUEST))
    })
  })
})
