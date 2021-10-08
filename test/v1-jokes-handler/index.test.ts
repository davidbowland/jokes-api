import * as index from '@v1-jokes-handler/index'
import {
  APIGatewayEvent,
  APIGatewayEventHander,
  APIGatewayEventResult,
  handler,
  processRequest,
} from '@v1-jokes-handler/index'

import { resourceByID, resourcePlain, resourceRandom } from '@v1-jokes-handler/config'
import { getCorsHeadersFromEvent } from '@v1-jokes-handler/event-processing'
import status from '@v1-jokes-handler/status'
import { processById } from '@v1-jokes-handler/v1-jokes-by-id'
import { processPlain } from '@v1-jokes-handler/v1-jokes-plain'
import { processRandom } from '@v1-jokes-handler/v1-jokes-random'

jest.mock('@v1-jokes-handler/dynamodb', () => ({
  getDataByIndex: () => Promise.resolve({}),
}))
jest.mock('@v1-jokes-handler/error-handling', () => ({
  handleErrorWithDefault: (value) => () => value,
}))
jest.mock('@v1-jokes-handler/event-processing')
jest.mock('@v1-jokes-handler/v1-jokes-by-id')
jest.mock('@v1-jokes-handler/v1-jokes-plain')
jest.mock('@v1-jokes-handler/v1-jokes-random')

describe('index', () => {
  const event = { resource: resourceByID, httpMethod: 'GET' } as unknown as APIGatewayEvent

  describe('processRequest', () => {
    beforeAll(() => {
      ;(processById as jest.Mock).mockResolvedValue({ value: 'unique-processById-value843' })
      ;(processPlain as jest.Mock).mockResolvedValue({ value: 'unique-processPlain-value715' })
      ;(processRandom as jest.Mock).mockResolvedValue({ value: 'unique-processRandom-value692' })
    })

    test('expect httpMethod of OPTIONS returns only status.OK', async () => {
      const tempEvent = { httpMethod: 'OPTIONS' } as unknown as APIGatewayEvent

      const result = await processRequest(tempEvent)
      expect(result).toEqual(status.OK)
    })

    test.each([
      [resourceByID, processById],
      [resourcePlain, processPlain],
      [resourceRandom, processRandom],
    ])(
      'expect each resource returns the correct processor',
      async (resource: string, processFunc: APIGatewayEventHander) => {
        const tempEvent = { ...event, resource }
        const expectedResult = await processFunc(tempEvent)
        ;(processFunc as jest.Mock).mockClear()

        const result = await processRequest(tempEvent)
        expect(result).toEqual(expectedResult)
      }
    )

    test('expect unknown resource returns status.BAD_REQUEST', async () => {
      const tempEvent = { ...event, resource: '://cannot\\\\:exist' } as unknown as APIGatewayEvent

      const result = await processRequest(tempEvent)
      expect(result).toEqual(expect.objectContaining(status.BAD_REQUEST))
    })

    test('expect processor rejecting returns status.INTERNAL_SERVER_ERROR', async () => {
      const tempEvent = { ...event, resource: resourceByID }
      ;(processById as jest.Mock).mockRejectedValueOnce('Oh no!')

      const result = await processRequest(tempEvent)
      expect(result).toEqual(expect.objectContaining(status.INTERNAL_SERVER_ERROR))
    })
  })

  describe('handler', () => {
    const corsHeaders = { cors: 'pain and misery' }
    const processRequest = jest.spyOn(index, 'processRequest')

    beforeAll(() => {
      processRequest.mockResolvedValue(status.OK)
      ;(getCorsHeadersFromEvent as jest.Mock).mockReturnValue(corsHeaders)
    })

    afterAll(() => {
      processRequest.mockRestore()
    })

    test.each([status.OK, { get: 'smart' } as unknown as APIGatewayEventResult])(
      'expect processRequest result (expected=%s)',
      async (expectedResult: APIGatewayEventResult) => {
        processRequest.mockImplementationOnce(async (passedEvent: APIGatewayEvent) => {
          if (passedEvent != event) {
            throw `Invalid event passed ${JSON.stringify(passedEvent)} expected ${JSON.stringify(event)}`
          }
          return expectedResult
        })

        const result = await handler(event)
        expect(result).toEqual(expect.objectContaining(expectedResult))
      }
    )

    test('expect CORS header is correct', async () => {
      const result = await handler(event)
      expect(result).toEqual(expect.objectContaining({ headers: corsHeaders }))
    })

    test('expect error returns status.INTERNAL_SERVER_ERROR', async () => {
      processRequest.mockRejectedValueOnce('if I only had a brain')

      const result = await handler(event)
      expect(result).toEqual(expect.objectContaining(status.INTERNAL_SERVER_ERROR))
    })
  })
})
