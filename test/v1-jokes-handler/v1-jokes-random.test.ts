import { jokeTableReferenceIndex } from '@v1-jokes-handler/config'
import { getDataByIndex, getDataByIndexBatch, Joke, ReferenceInfo } from '@v1-jokes-handler/dynamodb'
import { getIntFromParameter, getListFromParameter, Options } from '@v1-jokes-handler/event-processing'
import { APIGatewayEvent, APIGatewayEventResult } from '@v1-jokes-handler/index'
import status from '@v1-jokes-handler/status'
import * as v1JokesRandom from '@v1-jokes-handler/v1-jokes-random'
import { getRandom, processRandom } from '@v1-jokes-handler/v1-jokes-random'

jest.mock('@v1-jokes-handler/dynamodb')
jest.mock('@v1-jokes-handler/error-handling', () => ({
  handleErrorWithDefault: (value) => () => value,
}))
jest.mock('@v1-jokes-handler/event-processing')
jest.mock('@v1-jokes-handler/index')

describe('v1-jokes-random', () => {
  const referenceInfo: ReferenceInfo = { count: 2 }
  const joke: Joke = { joke: 'my fashion sense' }
  const jokeTable: { [key: number]: Joke | ReferenceInfo } = {
    [jokeTableReferenceIndex]: referenceInfo,
    1: joke,
    2: { joke: 'congress' },
  }

  beforeAll(() => {
    ;(getDataByIndex as jest.Mock).mockImplementation(async (key: number) => jokeTable[key] ?? {})

    const mockMath = Object.create(global.Math)
    mockMath.random = () => 0
    global.Math = mockMath
  })

  describe('getRandom', () => {
    const count = 2
    const avoids: string[] = []

    beforeAll(() => {
      ;(getDataByIndexBatch as jest.Mock).mockImplementation(async (keys: number[]) => {
        return keys.reduce((result, index) => {
          result[index] = jokeTable[index] as Joke
          return result
        }, {} as { [key: number]: Joke })
      })
    })

    test('expect status.OK with a body', async () => {
      const result = await getRandom(referenceInfo, count, avoids)
      expect(result).toEqual(expect.objectContaining(status.OK))
      expect(result.body).toBeDefined()
    })

    test.each([
      [2, [], ['1', '2']],
      [2, ['1'], ['1', '2']],
      [1, [], ['1']],
      [1, ['1'], ['2']],
      [1, ['1', '2'], ['1']],
      [1, ['1', '2', '3'], ['1']],
    ])(
      'expect correct jokes given count %s and avoids %s (expectedResult=%s)',
      async (tempCount: number, tempAvoids: string[], expectedResult: string[]) => {
        const result = await getRandom(referenceInfo, tempCount, tempAvoids)
        expect(Object.keys(JSON.parse(result.body as string))).toEqual(expectedResult)
      }
    )

    test.each([-1, 0])('expect status.BAD_REQUEST when count is bad %s', async (tempCount: number) => {
      const result = await getRandom(referenceInfo, tempCount, avoids)
      expect(result).toEqual(expect.objectContaining(status.BAD_REQUEST))
    })
  })

  describe('processRandom', () => {
    const event = { httpMethod: 'GET' } as unknown as APIGatewayEvent
    const getRandom = jest.spyOn(v1JokesRandom, 'getRandom')
    const getReturnValue = { value: 'unique-getRandom-value8675309' } as unknown as APIGatewayEventResult

    beforeAll(() => {
      ;(getIntFromParameter as jest.Mock).mockImplementation(
        (event: APIGatewayEvent, parameterName: string, options?: Options) => {
          if (parameterName === 'count') {
            if (options?.default !== 1) {
              throw `getIntFromParameter for ${parameterName} didn't have expected default value 1 (default=${options?.default})`
            }
            return referenceInfo.count
          }
          throw `getIntFromParameter expected parameterName count (received=${parameterName})`
        }
      )
      ;(getListFromParameter as jest.Mock).mockImplementation((event: APIGatewayEvent, parameterName: string) => {
        if (parameterName === 'avoid') {
          return []
        }
        throw `getIntFromParameter expected parameterName avoid (received=${parameterName})`
      })

      getRandom.mockImplementation(async (tempReferenceInfo: ReferenceInfo, count: number) => {
        if (tempReferenceInfo.count !== referenceInfo.count) {
          throw `getRandom received referenceInfo ${JSON.stringify(tempReferenceInfo)} but expected ${JSON.stringify(
            referenceInfo
          )}`
        } else if (count < 1) {
          throw `getPlain received bad count ${count}`
        }
        return getReturnValue
      })
    })

    test('expect GET to invoke getRandom', async () => {
      const httpMethod = 'GET'
      const tempEvent = { ...event, httpMethod } as unknown as APIGatewayEvent

      const result = await processRandom(Promise.resolve(referenceInfo), tempEvent)
      expect(result).toEqual(getReturnValue)
      expect(getRandom).toHaveBeenCalledTimes(1)
    })

    test('expect status.BAD_REQUEST when httpMethod is unknown', async () => {
      const tempEvent = { ...event, httpMethod: 'FNORD' } as unknown as APIGatewayEvent
      const result = await processRandom(Promise.resolve(referenceInfo), tempEvent)
      expect(result).toEqual(expect.objectContaining(status.BAD_REQUEST))
    })
  })
})
