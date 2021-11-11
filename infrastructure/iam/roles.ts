import * as aws from '@pulumi/aws'

import { createdBy, createdFor } from '@vars'

// https://www.pulumi.com/docs/reference/pkg/aws/iam/role/

export const lambdaRole = new aws.iam.Role('lambda-role', {
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Principal: {
          Service: 'lambda.amazonaws.com',
        },
        Effect: 'Allow',
        Sid: '',
      },
    ],
  }),
  description: 'Assumable role for jokes-handler lambda',
  name: 'lambda-jokes-handler',
  tags: {
    'created-by': createdBy,
    'created-for': createdFor,
  },
})

export const cloudwatchLogRole = new aws.iam.Role('cloudwatch-log-role', {
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Principal: {
          Service: 'apigateway.amazonaws.com',
        },
        Effect: 'Allow',
        Sid: '',
      },
    ],
  }),
  description: 'Assumable role for jokes-handler lambda',
  name: 'lambda-jokes-handler-cloudwatch-log',
  tags: {
    'created-by': createdBy,
    'created-for': createdFor,
  },
})
