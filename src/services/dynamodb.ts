import { DynamoDB } from 'aws-sdk'

import { Index, JokeBatch } from '../types'
import { dynamodbTableName } from '../config'
import { xrayCapture } from '../utils/logging'

const dynamodb = xrayCapture(new DynamoDB({ apiVersion: '2012-08-10' }))

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

/* Get single item */

export const getDataByIndex = (index: number): Promise<any> =>
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
    .then((response: any) => response.Item.Data.S)
    .then(JSON.parse)

/* Batch get items */

const getItemsFromBatch = (items: DynamoDB.Types.AttributeMap[]): JokeBatch =>
  items.reduce(
    (result, item) => ({ ...result, [item.Index.N as string]: JSON.parse(item.Data.S as string) }),
    {} as JokeBatch
  )

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
    .then((response: any) => response.Responses[dynamodbTableName])
    .then(getItemsFromBatch)

/* Get highest index */

export const getHighestIndex = (): Promise<number> =>
  getDataByIndex(0)
    .then((data: Index) => data.count)
    .catch(() => 0)

/* Scan for items */

const getItemsFromScan = (response: DynamoDB.Types.ScanOutput): JokeBatch[] =>
  response.Items?.reduce(
    (result, item) =>
      item.Index.N !== '0'
        ? [...result, { data: JSON.parse(item.Data.S as string), id: parseInt(item.Index.N as string, 10) }]
        : result,
    [] as JokeBatch[]
  ) as JokeBatch[]

export const scanData = (): Promise<JokeBatch[]> =>
  dynamodb
    .scan({
      AttributesToGet: ['Data', 'Index'],
      TableName: dynamodbTableName,
    })
    .promise()
    .then((response: any) => getItemsFromScan(response))

/* Set item */

export const setDataByIndex = (index: number, data: unknown): Promise<DynamoDB.Types.PutItemOutput> =>
  dynamodb
    .putItem({
      Item: {
        Data: {
          S: JSON.stringify(data),
        },
        Index: {
          N: `${index}`,
        },
      },
      TableName: dynamodbTableName,
    })
    .promise()

/* Set highest index */

export const setHighestIndex = (count: number): Promise<DynamoDB.Types.PutItemOutput> => setDataByIndex(0, { count })
