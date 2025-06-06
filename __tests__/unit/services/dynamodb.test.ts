import { index, joke } from '../__mocks__'
import {
  deleteDataByIndex,
  getDataByIndex,
  getDataByIndexBatch,
  getHighestIndex,
  scanData,
  setDataByIndex,
  setHighestIndex,
} from '@services/dynamodb'

const mockSend = jest.fn()
jest.mock('@aws-sdk/client-dynamodb', () => ({
  BatchGetItemCommand: jest.fn().mockImplementation((x) => x),
  DeleteItemCommand: jest.fn().mockImplementation((x) => x),
  DynamoDB: jest.fn(() => ({
    send: (...args) => mockSend(...args),
  })),
  GetItemCommand: jest.fn().mockImplementation((x) => x),
  PutItemCommand: jest.fn().mockImplementation((x) => x),
  QueryCommand: jest.fn().mockImplementation((x) => x),
  ScanCommand: jest.fn().mockImplementation((x) => x),
}))
jest.mock('@utils/logging', () => ({
  xrayCapture: jest.fn().mockImplementation((x) => x),
}))

describe('dynamodb', () => {
  describe('deleteDataByIndex', () => {
    test('expect index passed to delete', async () => {
      await deleteDataByIndex(index)

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: {
            Index: {
              N: `${index}`,
            },
          },
          TableName: 'jokes-table',
        }),
      )
    })
  })

  describe('getDataByIndex', () => {
    beforeAll(() => {
      mockSend.mockResolvedValue({ Item: { Data: { S: JSON.stringify(joke) } } })
    })

    test('expect index passed to get', async () => {
      await getDataByIndex(index)

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: {
            Index: {
              N: `${index}`,
            },
          },
          TableName: 'jokes-table',
        }),
      )
    })

    test('expect data parsed and returned', async () => {
      const result = await getDataByIndex(index)

      expect(result).toEqual(joke)
    })
  })

  describe('getDataByIndexBatch', () => {
    beforeAll(() => {
      mockSend.mockResolvedValue({
        Responses: { 'jokes-table': [{ Data: { S: JSON.stringify(joke) }, Index: { N: `${index}` } }] },
      })
    })

    test('expect index passed to get', async () => {
      await getDataByIndexBatch([index])

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          RequestItems: {
            'jokes-table': {
              Keys: [
                {
                  Index: {
                    N: `${index}`,
                  },
                },
              ],
            },
          },
        }),
      )
    })

    test('expect data parsed and returned', async () => {
      const result = await getDataByIndexBatch([index])

      expect(result).toEqual({ [index]: joke })
    })
  })

  describe('getHighestIndex', () => {
    beforeAll(() => {
      mockSend.mockResolvedValue({ Item: { Data: { S: JSON.stringify({ count: index }) } } })
    })

    test('expect index passed to get', async () => {
      await getHighestIndex()

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: {
            Index: {
              N: '0',
            },
          },
          TableName: 'jokes-table',
        }),
      )
    })

    test('expect data parsed and returned', async () => {
      const result = await getHighestIndex()

      expect(result).toEqual(index)
    })

    test('expect zero when get rejects', async () => {
      mockSend.mockRejectedValueOnce(undefined)
      const result = await getHighestIndex()

      expect(result).toEqual(0)
    })
  })

  describe('scanData', () => {
    beforeAll(() => {
      mockSend.mockResolvedValue({
        Items: [
          { Data: { S: JSON.stringify({ count: index }) }, Index: { N: '0' } },
          { Data: { S: JSON.stringify(joke) }, Index: { N: `${index}` } },
        ],
      })
    })

    test('expect data parsed and returned', async () => {
      const result = await scanData()

      expect(result).toEqual([{ data: { contents: 'ROFL' }, id: 42 }])
    })

    test('expect empty object with no data returned', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] })
      const result = await scanData()

      expect(result).toEqual([])
    })
  })

  describe('setDataByIndex', () => {
    test('expect index and data passed to put', async () => {
      await setDataByIndex(index, joke)

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          Item: {
            Data: {
              S: JSON.stringify(joke),
            },
            Index: {
              N: `${index}`,
            },
          },
          TableName: 'jokes-table',
        }),
      )
    })
  })

  describe('setHighestIndex', () => {
    const count = 42

    test('expect index and count passed to put', async () => {
      await setHighestIndex(count)

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          Item: {
            Data: {
              S: JSON.stringify({ count }),
            },
            Index: {
              N: '0',
            },
          },
          TableName: 'jokes-table',
        }),
      )
    })
  })
})
