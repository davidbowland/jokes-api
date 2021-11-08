import * as aws from '@pulumi/aws'

import { getMostRecentLambdaVersion } from '../aws-vars'
import { lambdaRole } from '../iam/roles'
import { jokesTable } from '../dynamodb/tables'
import {
  createdBy,
  createdFor,
  corsOrigins,
  defaultOrigin,
  fetchCountMaximum,
  jokeTableReferenceIndex,
  lambdaTimeoutInSeconds,
  lambdaSourceBucket,
  resourceById,
  resourcePlain,
  resourceRandom,
} from '../vars'

// https://www.pulumi.com/docs/reference/pkg/aws/lambda/function/

const s3Key = 'jokes-handler/v1-jokes-handler.zip'

export const zipV1JokesHandler = new aws.lambda.Function('zip-v1-jokes-handler', {
  environment: {
    variables: {
      CORS_ORIGINS: corsOrigins,
      DEFAULT_ORIGIN: defaultOrigin,
      DYNAMODB_TABLE_NAME: jokesTable.name,
      FETCH_COUNT_MAXIMUM: fetchCountMaximum,
      JOKE_TABLE_REFERENCE_INDEX: jokeTableReferenceIndex,
      RESOURCE_BY_ID: resourceById,
      RESOURCE_PLAIN: resourcePlain,
      RESOURCE_RANDOM: resourceRandom,
    },
  },
  handler: 'index.handler',
  name: 'v1-jokes-handler',
  role: lambdaRole.arn,
  runtime: aws.lambda.Runtime.NodeJS14dX,
  s3Bucket: lambdaSourceBucket,
  s3Key,
  s3ObjectVersion: getMostRecentLambdaVersion(s3Key),
  timeout: lambdaTimeoutInSeconds,
  tags: {
    'created-by': createdBy,
    'created-for': createdFor,
  },
})
