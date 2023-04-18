import * as AWSXRay from 'aws-xray-sdk-core'
import { log, logError, xrayCapture } from '@utils/logging'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { mocked } from 'jest-mock'

jest.mock('aws-xray-sdk-core')

describe('logging', () => {
  beforeAll(() => {
    console.error = jest.fn()
    console.log = jest.fn()
  })

  describe('log', () => {
    test.each(['Hello', 0, null, undefined, { a: 1, b: 2 }])(
      'expect logFunc to have been called with message',
      async (value) => {
        const message = `Log message for value ${JSON.stringify(value)}`
        await log(message)

        expect(console.log).toHaveBeenCalledWith(message)
      }
    )
  })

  describe('logError', () => {
    test.each(['Hello', 0, null, undefined, { a: 1, b: 2 }])(
      'expect logFunc to have been called with message',
      async (value) => {
        const message = `Error message for value ${JSON.stringify(value)}`
        const error = new Error(message)
        await logError(error)

        expect(console.error).toHaveBeenCalledWith(error)
      }
    )
  })

  describe('xrayCapture', () => {
    const capturedDynamodb = 'captured-dynamodb' as unknown as DynamoDB
    const dynamodb = 'dynamodb'

    beforeAll(() => {
      mocked(AWSXRay).captureAWSv3Client.mockReturnValue(capturedDynamodb)
    })

    test('expect AWSXRay.captureAWSClient when x-ray is enabled (not running locally)', () => {
      process.env.AWS_SAM_LOCAL = 'false'
      const result = xrayCapture(dynamodb)

      expect(mocked(AWSXRay).captureAWSv3Client).toHaveBeenCalledWith(dynamodb)
      expect(result).toEqual(capturedDynamodb)
    })

    test('expect same object when x-ray is disabled (running locally)', () => {
      process.env.AWS_SAM_LOCAL = 'true'
      const result = xrayCapture(dynamodb)

      expect(mocked(AWSXRay).captureAWSv3Client).toHaveBeenCalledTimes(0)
      expect(result).toEqual(dynamodb)
    })
  })
})
