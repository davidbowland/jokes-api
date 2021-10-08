import { DynamoDB } from 'aws-sdk'

import { dynamodbTableName } from '@v1-jokes-handler/config'
import {
  deleteDataByIndex,
  getDataByIndex,
  getDataByIndexBatch,
  Joke,
  setDataByIndex,
} from '@v1-jokes-handler/dynamodb'

const mockGetItem = jest.fn()
const mockBatchGetItem = jest.fn()
const mockPutItem = jest.fn()
const mockDeleteItem = jest.fn()
jest.mock('aws-sdk', () => ({
  DynamoDB: jest.fn(() => ({
    getItem: (params: DynamoDB.Types.GetItemInput) => ({ promise: () => mockGetItem(params) }),
    batchGetItem: (params: DynamoDB.Types.BatchGetItemInput) => ({
      promise: () => mockBatchGetItem(params),
    }),
    putItem: (params: DynamoDB.Types.PutItemInput) => ({ promise: () => mockPutItem(params) }),
    deleteItem: (params: DynamoDB.Types.DeleteItemInput) => ({
      promise: () => mockDeleteItem(params),
    }),
  })),
}))

jest.mock('@v1-jokes-handler/error-handling', () => ({
  handleErrorWithDefault: (value) => () => value,
}))

describe('DynamoDB', () => {
  const joke: Joke = {
    joke: 'lolol',
  }

  describe('getDataByIndex', () => {
    beforeAll(() => {
      mockGetItem.mockImplementation(async (params: DynamoDB.Types.GetItemInput) => {
        if (isNaN(parseInt(params.Key?.Index?.N ?? '', 10)) || params.TableName !== dynamodbTableName) {
          throw `Invalid input to mockGetItem: ${JSON.stringify(params)}`
        }
        return { Item: { Data: { S: JSON.stringify(joke) } } }
      })
    })

    test('expect result from DynamoDB', async () => {
      const index = 3

      const result = await getDataByIndex(index)
      expect(result).toEqual(joke)
    })

    test.each([undefined, {}])(
      'expect empty object when no/malformed data is retrieved',
      async (resolvedValue: Record<string, unknown> | undefined) => {
        const index = 1
        mockGetItem.mockResolvedValueOnce(resolvedValue)

        const result = await getDataByIndex(index)
        expect(result).toEqual({})
      }
    )
  })

  describe('getDataByIndexBatch', () => {
    beforeAll(() => {
      mockBatchGetItem.mockImplementation(async (params: DynamoDB.Types.BatchGetItemInput) => {
        const tableName = Object.keys(params.RequestItems)[0]
        if (
          isNaN(parseInt(params.RequestItems[tableName].Keys[0]?.Index?.N ?? '', 10)) ||
          tableName !== dynamodbTableName
        ) {
          throw `Invalid input to mockBatchGetItem: ${JSON.stringify(params)}`
        }
        const index = params.RequestItems[tableName].Keys[0].Index.N
        return {
          Responses: { [tableName]: [{ Index: { N: index }, Data: { S: JSON.stringify(joke) } }] },
        }
      })
    })

    test('expect result from DynamoDB', async () => {
      const index = 4

      const result = await getDataByIndexBatch([index])
      expect(result).toEqual({ [index]: joke })
    })

    test('expect empty object when no data is retrieved', async () => {
      const index = 2
      mockBatchGetItem.mockResolvedValueOnce(undefined)

      const result = await getDataByIndexBatch([index])
      expect(result).toEqual({})
    })

    test('expect empty object when malformed data is retrieved', async () => {
      const index = 3
      mockBatchGetItem.mockImplementationOnce(async (params: DynamoDB.Types.BatchGetItemInput) => {
        const TableName = Object.keys(params.RequestItems)[0]
        return {
          Responses: {
            [TableName]: [{ Item: { Index: { N: `${index}` }, Data: { S: 'malformed json' } } }],
          },
        }
      })

      const result = await getDataByIndexBatch([index])
      expect(result).toEqual({})
    })
  })

  describe('setDataByIndex', () => {
    test('expect data passed to DynamoDB', async () => {
      const index = 6

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
        TableName: dynamodbTableName,
      })
    })
  })

  describe('deleteDataByIndex', () => {
    test('expect data passed to DynamoDB', async () => {
      const index = 5

      await deleteDataByIndex(index)

      expect(mockDeleteItem).toHaveBeenCalledWith({
        Key: {
          Index: {
            N: `${index}`,
          },
        },
        TableName: dynamodbTableName,
      })
    })
  })
})
