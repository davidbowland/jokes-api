process.env.DYNAMODB_TABLE_NAME = 'jokes-table'
process.env.FETCH_COUNT_MAXIMUM = '10'
process.env.JOKE_TABLE_REFERENCE_INDEX = '0'

// Resources

process.env.API_URL = 'https://dbowland.com/v1/'
process.env.RESOURCE_BY_ID = '/jokes/{id}'
process.env.RESOURCE_PLAIN = '/jokes'
process.env.RESOURCE_RANDOM = '/jokes/random'

// CORS

process.env.CORS_ORIGINS = 'https://dbowland.com/,http://localhost:9000/'
process.env.DEFAULT_ORIGIN = 'https://dbowland.com/'
