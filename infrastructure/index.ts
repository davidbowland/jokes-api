// Import Pulumi configuration
import './config'

// Import modules to create resources
import { jokesHandlerApi } from '@api-gateway'
import '@dynamodb'
import '@iam'
import { zipV1JokesHandler } from '@lambda'

// Outputs

export const apiUrl = jokesHandlerApi.url
export const lambdaV1JokesArn = zipV1JokesHandler.arn
