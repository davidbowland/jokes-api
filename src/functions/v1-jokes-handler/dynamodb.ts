import { DynamoDB } from 'aws-sdk'

import { dynamodbTableName } from './config'

const dynamodb = new DynamoDB({ apiVersion: '2012-08-10' })

export interface Joke {
  joke?: string
}

export interface JokeBatch {
  [key: string]: Joke
}

export interface ReferenceInfo {
  count: number
}

export const getDataByIndex = async (index: number): Promise<Joke | ReferenceInfo> => {
  const params = {
    Key: {
      Index: {
        N: `${index}`,
      },
    },
    TableName: dynamodbTableName,
  }
  const item = await dynamodb.getItem(params).promise()
  try {
    return JSON.parse(item?.Item?.Data?.S as string)
  } catch (error) {
    console.error(error)
    return {}
  }
}

export const getDataByIndexBatch = async (indexes: number[]): Promise<JokeBatch> => {
  const params = {
    RequestItems: {
      [dynamodbTableName]: {
        Keys: indexes.map((index) => ({
          Index: {
            N: `${index}`,
          },
        })),
      },
    },
  }
  const items = await dynamodb.batchGetItem(params).promise()
  const responses = items?.Responses ?? {}
  return responses[dynamodbTableName].reduce((result, item) => {
    try {
      result[item.Index.N as string] = JSON.parse(item.Data.S as string)
    } catch (error) {
      console.error(error)
    }
    return result
  }, {} as JokeBatch)
}

export const setDataByIndex = async (index: number, data: Joke | ReferenceInfo): Promise<void> => {
  const params = {
    Item: {
      Index: {
        N: `${index}`,
      },
      Data: {
        S: JSON.stringify(data),
      },
    },
    TableName: dynamodbTableName,
  }
  await dynamodb.putItem(params).promise()
}

export const deleteDataByIndex = async (index: number): Promise<void> => {
  const params = {
    Key: {
      Index: {
        N: `${index}`,
      },
    },
    TableName: dynamodbTableName,
  }
  await dynamodb.deleteItem(params).promise()
}
