// DynamoDB

export const dynamodbTableName = process.env.DYNAMODB_TABLE_NAME as string
export const fetchCountMaximum = parseInt(process.env.FETCH_COUNT_MAXIMUM as string, 10)
export const jokeTableReferenceIndex = parseInt(process.env.JOKE_TABLE_REFERENCE_INDEX as string, 10)

// Resources

export const apiUrl = process.env.API_URL as string
export const resourceByID = process.env.RESOURCE_BY_ID as string
export const resourcePlain = process.env.RESOURCE_PLAIN as string
export const resourceRandom = process.env.RESOURCE_RANDOM as string

// CORS

export const corsOrigins = (process.env.CORS_ORIGINS as string).split(',')
export const defaultOrigin = process.env.DEFAULT_ORIGIN as string
export const corsMethods = {
  [resourceByID]: 'OPTIONS,GET,PATCH,PUT,DELETE',
  [resourcePlain]: 'OPTIONS,GET,POST',
  [resourceRandom]: 'OPTIONS,GET',
}
