import { handleErrorWithDefault } from '@v1-jokes-handler/error-handling'

describe('error-handling', () => {
  describe('handleErrorWithDefault', () => {
    test.each(['Hello', 0, null, undefined, { a: 1, b: 2 }])('expect value back when passed', (value) => {
      const message = `Error message for value ${JSON.stringify(value)}`
      const error = new Error(message)

      const result = handleErrorWithDefault(value)
      expect(result(error)).toEqual(value)
    })
  })
})
