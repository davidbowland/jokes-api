import * as aws from '@pulumi/aws'

import { getMostRecentLambdaVersion } from '../aws-vars'
import { lambda_role } from '../iam/roles'
import { jokes_table } from '../dynamodb/tables'
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

export const zip_v1_jokes_handler = new aws.lambda.Function('zip-v1-jokes-handler', {
  environment: {
    variables: {
      CORS_ORIGINS: corsOrigins,
      DEFAULT_ORIGIN: defaultOrigin,
      DYNAMODB_TABLE_NAME: jokes_table.name,
      FETCH_COUNT_MAXIMUM: fetchCountMaximum,
      JOKE_TABLE_REFERENCE_INDEX: jokeTableReferenceIndex,
      RESOURCE_BY_ID: `/v1${resourceById}`,
      RESOURCE_PLAIN: `/v1${resourcePlain}`,
      RESOURCE_RANDOM: `/v1${resourceRandom}`,
    },
  },
  handler: 'index.handler',
  name: 'v1-jokes-handler',
  role: lambda_role.arn,
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
