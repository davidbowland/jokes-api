import * as pulumi from '@pulumi/pulumi'

// Import Pulumi configuration
import './config'

// Import modules to create resources
import '@api-gateway'
import '@dynamodb'
import '@iam'
import '@lambda'
import '@route53'

// Outputs

import { jokesHandlerApi } from '@api-gateway'
import { zipV1JokesHandler } from '@lambda'
import { apiHostname } from '@vars'

export const lambdaV1JokesApiUrl = pulumi.interpolate`https://${apiHostname}/${jokesHandlerApi.stage.stageName}`
export const lambdaV1JokesArn = zipV1JokesHandler.arn
