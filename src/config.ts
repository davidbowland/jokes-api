import { Engine, VoiceId } from '@aws-sdk/client-polly'

// API

export const apiUrl = process.env.API_URL as string

// DynamoDB

export const dynamodbTableName = process.env.DYNAMODB_TABLE_NAME as string
export const randomCountMaximum = parseInt(process.env.RANDOM_COUNT_MAXIMUM as string, 10)

// ID Generation

export const idMinLength = parseInt(process.env.ID_MIN_LENGTH as string, 10)
export const idMaxLength = parseInt(process.env.ID_MAX_LENGTH as string, 10)

// JsonPatch

export const throwOnInvalidJsonPatch = true
export const mutateObjectOnJsonPatch = false

// Polly

export const pollyAudioVersion = process.env.POLLY_AUDIO_VERSION as string
export const pollyEngine = process.env.POLLY_ENGINE as Engine
export const pollyVoiceId = process.env.POLLY_VOICE_ID as VoiceId
