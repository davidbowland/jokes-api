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

const mockBatchGetItem = jest.fn()
const mockDeleteItem = jest.fn()
const mockGetItem = jest.fn()
const mockPutItem = jest.fn()
const mockScanTable = jest.fn()
jest.mock('aws-sdk', () => ({
  DynamoDB: jest.fn(() => ({
    batchGetItem: (...args) => ({ promise: () => mockBatchGetItem(...args) }),
    deleteItem: (...args) => ({ promise: () => mockDeleteItem(...args) }),
    getItem: (...args) => ({ promise: () => mockGetItem(...args) }),
    putItem: (...args) => ({ promise: () => mockPutItem(...args) }),
    scan: (...args) => ({ promise: () => mockScanTable(...args) }),
  })),
}))

describe('dynamodb', () => {
  describe('deleteDataByIndex', () => {
    test('expect index passed to delete', async () => {
      await deleteDataByIndex(index)
      expect(mockDeleteItem).toHaveBeenCalledWith({
        Key: {
          Index: {
            N: `${index}`,
          },
        },
        TableName: 'jokes-table',
      })
    })
  })

  describe('getDataByIndex', () => {
    beforeAll(() => {
      mockGetItem.mockResolvedValue({ Item: { Data: { S: JSON.stringify(joke) } } })
    })

    test('expect index passed to get', async () => {
      await getDataByIndex(index)
      expect(mockGetItem).toHaveBeenCalledWith({
        Key: {
          Index: {
            N: `${index}`,
          },
        },
        TableName: 'jokes-table',
      })
    })

    test('expect data parsed and returned', async () => {
      const result = await getDataByIndex(index)
      expect(result).toEqual(joke)
    })
  })

  describe('getDataByIndexBatch', () => {
    beforeAll(() => {
      mockBatchGetItem.mockResolvedValue({
        Responses: { 'jokes-table': [{ Index: { N: `${index}` }, Data: { S: JSON.stringify(joke) } }] },
      })
    })

    test('expect index passed to get', async () => {
      await getDataByIndexBatch([index])
      expect(mockBatchGetItem).toHaveBeenCalledWith({
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
      })
    })

    test('expect data parsed and returned', async () => {
      const result = await getDataByIndexBatch([index])
      expect(result).toEqual({ [index]: joke })
    })
  })

  describe('getHighestIndex', () => {
    beforeAll(() => {
      mockGetItem.mockResolvedValue({ Item: { Data: { S: JSON.stringify({ count: index }) } } })
    })

    test('expect index passed to get', async () => {
      await getHighestIndex()
      expect(mockGetItem).toHaveBeenCalledWith({
        Key: {
          Index: {
            N: '0',
          },
        },
        TableName: 'jokes-table',
      })
    })

    test('expect data parsed and returned', async () => {
      const result = await getHighestIndex()
      expect(result).toEqual(index)
    })
  })

  describe('scanData', () => {
    beforeAll(() => {
      mockScanTable.mockResolvedValue({
        Items: [
          { Index: { N: '0' }, Data: { S: JSON.stringify({ count: index }) } },
          { Index: { N: `${index}` }, Data: { S: JSON.stringify(joke) } },
        ],
      })
    })

    test('expect data parsed and returned', async () => {
      const result = await scanData()
      expect(result).toEqual({ [index]: joke })
    })

    test('expect empty object with no data returned', async () => {
      mockScanTable.mockResolvedValueOnce({ Items: [] })
      const result = await scanData()
      expect(result).toEqual({})
    })
  })

  describe('setDataByIndex', () => {
    test('expect index and data passed to put', async () => {
      await setDataByIndex(index, joke)
      expect(mockPutItem).toHaveBeenCalledWith({
        Item: {
          Index: {
            N: `${index}`,
          },
          Data: {
            S: JSON.stringify(joke),
          },
        },
        TableName: 'jokes-table',
      })
    })
  })

  describe('setHighestIndex', () => {
    const count = 42

    test('expect index and count passed to put', async () => {
      await setHighestIndex(count)
      expect(mockPutItem).toHaveBeenCalledWith({
        Item: {
          Index: {
            N: '0',
          },
          Data: {
            S: JSON.stringify({ count }),
          },
        },
        TableName: 'jokes-table',
      })
    })
  })
})