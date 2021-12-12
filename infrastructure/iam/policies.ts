import * as aws from '@pulumi/aws'

import { jokesTable } from '@dynamodb'
import { createdBy, createdFor, environmentVariableKmsArn, projectName } from '@vars'

// https://www.pulumi.com/docs/reference/pkg/aws/iam/policy/

export const accessDynamodbPolicy = new aws.iam.Policy('dynamodb-access', {
  path: '/',
  description: 'Full access to joke table in DynamoDB',
  policy: jokesTable.name.apply((dynamoTableName) =>
    JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: 'dynamodb:*',
          Resource: `arn:aws:dynamodb:*:*:table/${dynamoTableName}`,
        },
      ],
    })
  ),
  name: `lambda-${projectName}-handler-dynamodb-access`,
  tags: {
    'created-by': createdBy,
    'created-for': createdFor,
  },
})

export const lambdaKmsAccessPolicy = new aws.iam.Policy('kms-access', {
  path: '/',
  description: 'Access to KMS for Lambdas to decrypt environment variables',
  policy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: 'kms:Decrypt',
        Resource: environmentVariableKmsArn,
      },
    ],
  }),
  name: `lambda-${projectName}-handler-kms-access`,
  tags: {
    'created-by': createdBy,
    'created-for': createdFor,
  },
})
