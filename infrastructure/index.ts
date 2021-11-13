// Import Pulumi configuration
import './config'

// Import modules to create resources
import { jokesHandlerApi } from '@api-gateway'
import '@dynamodb'
import '@iam'
import '@lambda'

// Outputs

export const apiUrl = jokesHandlerApi.url
