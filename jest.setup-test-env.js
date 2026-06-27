// API

process.env.API_URL = 'https://jokes-api.bowland.link/v1/jokes'

// DynamoDB

process.env.DYNAMODB_TABLE_NAME = 'jokes-table'
process.env.RANDOM_COUNT_MAXIMUM = '3'

// ID Generation

process.env.ID_MIN_LENGTH = '6'
process.env.ID_MAX_LENGTH = '8'

// Polly

process.env.POLLY_AUDIO_VERSION = '42'
process.env.POLLY_ENGINE = 'generative'
process.env.POLLY_VOICE_ID = 'Ruth'
