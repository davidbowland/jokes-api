// API

export const apiUrl = process.env.API_URL as string
export const corsDomain = process.env.CORS_DOMAIN as string

// DynamoDB

export const dynamodbTableName = process.env.DYNAMODB_TABLE_NAME as string
export const randomCountMaximum = parseInt(process.env.RANDOM_COUNT_MAXIMUM as string, 10)

// JsonPatch

export const throwOnInvalidJsonPatch = true
export const mutateObjectOnJsonPatch = false
