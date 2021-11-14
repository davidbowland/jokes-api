import { handleErrorWithDefault } from '@v1-jokes-handler/error-handling'

describe('error-handling', () => {
  const logFunc = jest.fn()

  describe('handleErrorWithDefault', () => {
    test.each(['Hello', 0, null, undefined, { a: 1, b: 2 }])('expect value back when passed', (value) => {
      const message = `Error message for value ${JSON.stringify(value)}`
      const error = new Error(message)

      const result = handleErrorWithDefault(value, logFunc)
      expect(result(error)).toEqual(value)
      expect(logFunc).toHaveBeenCalledTimes(1)
    })
  })
})
