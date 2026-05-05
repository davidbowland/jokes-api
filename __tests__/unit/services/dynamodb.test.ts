import { id, joke } from '../__mocks__'
import {
  deleteJoke,
  getJokeById,
  getJokesByIds,
  getRoster,
  addToRoster,
  removeFromRoster,
  putJoke,
  scanJokes,
  updateJoke,
} from '@services/dynamodb'

const mockSend = jest.fn()
jest.mock('@aws-sdk/client-dynamodb', () => ({
  BatchGetItemCommand: jest.fn().mockImplementation((x) => x),
  ConditionalCheckFailedException: class ConditionalCheckFailedException extends Error {},
  DeleteItemCommand: jest.fn().mockImplementation((x) => x),
  DynamoDB: jest.fn(() => ({
    send: (...args) => mockSend(...args),
  })),
  GetItemCommand: jest.fn().mockImplementation((x) => x),
  PutItemCommand: jest.fn().mockImplementation((x) => x),
  ScanCommand: jest.fn().mockImplementation((x) => x),
  UpdateItemCommand: jest.fn().mockImplementation((x) => x),
}))
jest.mock('@utils/logging', () => ({
  xrayCapture: jest.fn().mockImplementation((x) => x),
}))

describe('dynamodb', () => {
  describe('getJokeById', () => {
    beforeAll(() => {
      mockSend.mockResolvedValue({
        Item: {
          Id: { S: id },
          contents: { S: joke.contents },
          version: { N: '1' },
        },
      })
    })

    test('expect id passed to get', async () => {
      await getJokeById(id)

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: { Id: { S: id } },
          TableName: 'jokes-table',
        }),
      )
    })

    test('expect joke returned', async () => {
      const result = await getJokeById(id)

      expect(result).toEqual(joke)
    })

    test('expect joke with audio returned', async () => {
      mockSend.mockResolvedValueOnce({
        Item: {
          Id: { S: id },
          audioBase64: { S: 'base64data' },
          audioContentType: { S: 'audio/ogg' },
          audioVersion: { S: '2' },
          contents: { S: joke.contents },
          version: { N: '1' },
        },
      })
      const result = await getJokeById(id)

      expect(result).toEqual({
        audio: { base64: 'base64data', contentType: 'audio/ogg', version: '2' },
        contents: joke.contents,
        version: 1,
      })
    })

    test('expect error when item not found', async () => {
      mockSend.mockResolvedValueOnce({ Item: undefined })

      await expect(getJokeById(id)).rejects.toThrow('Item not found')
    })
  })

  describe('getJokesByIds', () => {
    beforeAll(() => {
      mockSend.mockResolvedValue({
        Responses: {
          'jokes-table': [
            {
              Id: { S: id },
              contents: { S: joke.contents },
              version: { N: '1' },
            },
          ],
        },
      })
    })

    test('expect ids passed to batch get', async () => {
      await getJokesByIds([id])

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          RequestItems: {
            'jokes-table': {
              Keys: [{ Id: { S: id } }],
            },
          },
        }),
      )
    })

    test('expect jokes returned', async () => {
      const result = await getJokesByIds([id])

      expect(result).toEqual([{ data: joke, id }])
    })

    test('expect jokes with audio returned', async () => {
      mockSend.mockResolvedValueOnce({
        Responses: {
          'jokes-table': [
            {
              Id: { S: id },
              audioBase64: { S: 'base64data' },
              audioContentType: { S: 'audio/ogg' },
              audioVersion: { S: '2' },
              contents: { S: joke.contents },
              version: { N: '1' },
            },
          ],
        },
      })
      const result = await getJokesByIds([id])

      expect(result).toEqual([
        {
          data: {
            audio: { base64: 'base64data', contentType: 'audio/ogg', version: '2' },
            contents: joke.contents,
            version: 1,
          },
          id,
        },
      ])
    })

    test('expect empty array for empty input', async () => {
      const result = await getJokesByIds([])

      expect(result).toEqual([])
    })
  })

  describe('scanJokes', () => {
    beforeAll(() => {
      mockSend.mockResolvedValue({
        Items: [
          {
            Id: { S: id },
            contents: { S: joke.contents },
            version: { N: '1' },
          },
        ],
      })
    })

    test('expect jokes returned without META', async () => {
      const result = await scanJokes()

      expect(result).toEqual([{ data: { contents: joke.contents, version: 1 }, id }])
    })
  })

  describe('putJoke', () => {
    test('expect id and joke passed to put with condition', async () => {
      await putJoke(id, joke)

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          ConditionExpression: 'attribute_not_exists(Id)',
          Item: expect.objectContaining({
            Id: { S: id },
            contents: { S: joke.contents },
            version: { N: '1' },
          }),
          TableName: 'jokes-table',
        }),
      )
    })

    test('expect audio fields included when joke has audio', async () => {
      const jokeWithAudio = {
        ...joke,
        audio: { base64: 'base64data', contentType: 'audio/ogg', version: '2' },
      }
      await putJoke(id, jokeWithAudio)

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          Item: expect.objectContaining({
            audioBase64: { S: 'base64data' },
            audioContentType: { S: 'audio/ogg' },
            audioVersion: { S: '2' },
          }),
        }),
      )
    })
  })

  describe('updateJoke', () => {
    test('expect update with version condition', async () => {
      await updateJoke(id, joke, 1)

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          ConditionExpression: 'version = :expectedVersion',
          Key: { Id: { S: id } },
          TableName: 'jokes-table',
        }),
      )
    })

    test('expect audio fields in update when joke has audio', async () => {
      const jokeWithAudio = {
        ...joke,
        audio: { base64: 'base64data', contentType: 'audio/ogg', version: '2' },
      }
      await updateJoke(id, jokeWithAudio, 1)

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          ExpressionAttributeValues: expect.objectContaining({
            ':audioBase64': { S: 'base64data' },
            ':audioContentType': { S: 'audio/ogg' },
            ':audioVersion': { S: '2' },
          }),
        }),
      )
    })

    test('expect REMOVE expression when joke has no audio', async () => {
      await updateJoke(id, joke, 1)

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          UpdateExpression: expect.stringContaining('REMOVE audioBase64, audioContentType, audioVersion'),
        }),
      )
    })
  })

  describe('deleteJoke', () => {
    test('expect id passed to delete', async () => {
      await deleteJoke(id)

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: { Id: { S: id } },
          TableName: 'jokes-table',
        }),
      )
    })
  })

  describe('getRoster', () => {
    test('expect active ids returned', async () => {
      mockSend.mockResolvedValueOnce({
        Item: {
          Id: { S: 'META' },
          activeIds: { L: [{ S: id }, { S: 'abc123' }] },
        },
      })
      const result = await getRoster()

      expect(result).toEqual([id, 'abc123'])
    })

    test('expect empty array when no META item', async () => {
      mockSend.mockResolvedValueOnce({ Item: undefined })
      const result = await getRoster()

      expect(result).toEqual([])
    })
  })

  describe('addToRoster', () => {
    test('expect update expression to append id', async () => {
      await addToRoster(id)

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: { Id: { S: 'META' } },
          TableName: 'jokes-table',
        }),
      )
    })
  })

  describe('removeFromRoster', () => {
    test('expect roster updated without removed id and with version condition', async () => {
      mockSend.mockResolvedValueOnce({
        Item: {
          Id: { S: 'META' },
          activeIds: { L: [{ S: id }, { S: 'abc123' }] },
          version: { N: '5' },
        },
      })
      await removeFromRoster(id)

      expect(mockSend).toHaveBeenLastCalledWith(
        expect.objectContaining({
          ConditionExpression: 'version = :expectedVersion',
          ExpressionAttributeValues: { ':expectedVersion': { N: '5' } },
          Item: {
            Id: { S: 'META' },
            activeIds: { L: [{ S: 'abc123' }] },
            version: { N: '6' },
          },
          TableName: 'jokes-table',
        }),
      )
    })
  })
})
