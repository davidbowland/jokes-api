import { DynamoDB } from 'aws-sdk'

import { dynamodbTableName } from './config'
import { handleErrorWithDefault } from './error-handling'

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

/* Get single item */

const parseResponseJson = (response: DynamoDB.Types.GetItemOutput): Joke | ReferenceInfo =>
  JSON.parse(response?.Item?.Data.S as string)

export const getDataByIndex = (index: number): Promise<Joke | ReferenceInfo> =>
  dynamodb
    .getItem({
      Key: {
        Index: {
          N: `${index}`,
        },
      },
      TableName: dynamodbTableName,
    })
    .promise()
    .then(parseResponseJson)
    .catch(handleErrorWithDefault({}))

/* Batch get items */

const extractItemsFromResponse = (response: DynamoDB.Types.BatchGetItemOutput): DynamoDB.Types.AttributeMap[] =>
  response && response.Responses ? response.Responses[dynamodbTableName] : []

const collectParsedJokes = (result: JokeBatch, item: DynamoDB.Types.AttributeMap): JokeBatch => ({
  ...result,
  [item.Index.N as string]: JSON.parse(item.Data.S as string),
})

const convertBatchItemsIntoJokes = (items: DynamoDB.Types.AttributeMap[]) =>
  items.reduce(collectParsedJokes, {} as JokeBatch)

export const getDataByIndexBatch = (indexes: number[]): Promise<JokeBatch> =>
  dynamodb
    .batchGetItem({
      RequestItems: {
        [dynamodbTableName]: {
          Keys: indexes.map((index: number) => ({
            Index: {
              N: `${index}`,
            },
          })),
        },
      },
    })
    .promise()
    .then(extractItemsFromResponse)
    .then(convertBatchItemsIntoJokes)
    .catch(handleErrorWithDefault({} as JokeBatch))

/* Set item */

export const setDataByIndex = (index: number, data: Joke | ReferenceInfo): Promise<DynamoDB.Types.PutItemOutput> =>
  dynamodb
    .putItem({
      Item: {
        Index: {
          N: `${index}`,
        },
        Data: {
          S: JSON.stringify(data),
        },
      },
      TableName: dynamodbTableName,
    })
    .promise()

/* Delete item */

export const deleteDataByIndex = (index: number): Promise<DynamoDB.Types.DeleteItemOutput> =>
  dynamodb
    .deleteItem({
      Key: {
        Index: {
          N: `${index}`,
        },
      },
      TableName: dynamodbTableName,
    })
    .promise()
