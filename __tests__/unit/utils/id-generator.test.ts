import { randomInt } from 'crypto'

import { generateId } from '@utils/id-generator'

jest.mock('crypto', () => ({
  randomInt: jest.fn(),
}))

describe('id-generator', () => {
  const mockRandomInt = randomInt as jest.Mock

  describe('generateId', () => {
    it('should return a string id of expected length', () => {
      mockRandomInt.mockReturnValue(500000000)
      const result = generateId()

      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThanOrEqual(6)
      expect(result.length).toBeLessThanOrEqual(8)
    })

    it('should only contain allowed characters', () => {
      mockRandomInt.mockReturnValue(123456789)
      const result = generateId()

      expect(result).toMatch(/^[256789bcdfghjmnpqrstvwxz]+$/)
    })

    it('should produce different ids for different random values', () => {
      mockRandomInt.mockReturnValueOnce(100000000)
      const id1 = generateId()

      mockRandomInt.mockReturnValueOnce(999999999)
      const id2 = generateId()

      expect(id1).not.toEqual(id2)
    })

    it('should call randomInt with correct min and max bounds', () => {
      mockRandomInt.mockReturnValue(500000000)
      generateId()

      // 24^5 = 7,962,624 (min), 24^8 = 110,075,314,176 (max)
      expect(mockRandomInt).toHaveBeenCalledWith(7962624, 110075314176)
    })
  })
})
