import {
  BatchGetItemCommand,
  DeleteItemCommand,
  DeleteItemOutput,
  DynamoDB,
  GetItemCommand,
  PutItemCommand,
  PutItemOutput,
  ScanCommand,
  ScanOutput,
} from '@aws-sdk/client-dynamodb'

import { dynamodbTableName } from '../config'
import { Index, JokeBatch } from '../types'
import { xrayCapture } from '../utils/logging'

const dynamodb = xrayCapture(new DynamoDB({ apiVersion: '2012-08-10' }))

/* Delete item */

export const deleteDataByIndex = async (index: number): Promise<DeleteItemOutput> => {
  const command = new DeleteItemCommand({
    Key: {
      Index: {
        N: `${index}`,
      },
    },
    TableName: dynamodbTableName,
  })
  return dynamodb.send(command)
}

/* Get single item */

export const getDataByIndex = async (index: number): Promise<any> => {
  const command = new GetItemCommand({
    Key: {
      Index: {
        N: `${index}`,
      },
    },
    TableName: dynamodbTableName,
  })
  const response = await dynamodb.send(command)
  return JSON.parse(response.Item.Data.S)
}

/* Batch get items */

const getItemsFromBatch = (items: any[]): JokeBatch =>
  items.reduce(
    (result, item) => ({ ...result, [item.Index.N as string]: JSON.parse(item.Data.S as string) }),
    {} as JokeBatch,
  )

export const getDataByIndexBatch = async (indexes: number[]): Promise<JokeBatch> => {
  const command = new BatchGetItemCommand({
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
  const response = await dynamodb.send(command)
  return getItemsFromBatch(response.Responses[dynamodbTableName])
}

/* Get highest index */

export const getHighestIndex = async (): Promise<number> => {
  try {
    const data: Index = await getDataByIndex(0)
    return data.count
  } catch (e) {
    return 0
  }
}

/* Scan for items */

const getItemsFromScan = (response: ScanOutput): JokeBatch[] =>
  response.Items?.reduce(
    (result, item) =>
      item.Index.N === '0'
        ? result
        : [...result, { data: JSON.parse(item.Data.S as string), id: parseInt(item.Index.N as string, 10) }],
    [] as JokeBatch[],
  ) as JokeBatch[]

export const scanData = async (): Promise<JokeBatch[]> => {
  const command = new ScanCommand({
    AttributesToGet: ['Data', 'Index'],
    TableName: dynamodbTableName,
  })
  const response = await dynamodb.send(command)
  return getItemsFromScan(response)
}

/* Set item */

export const setDataByIndex = async (index: number, data: unknown): Promise<PutItemOutput> => {
  const command = new PutItemCommand({
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
  return dynamodb.send(command)
}

/* Set highest index */

export const setHighestIndex = async (count: number): Promise<PutItemOutput> => setDataByIndex(0, { count })
