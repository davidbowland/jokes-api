import * as aws from '@pulumi/aws'

import { accessDynamodbPolicy, lambdaKmsAccessPolicy } from './policies'
import { cloudwatchLogRole, lambdaRole } from './roles'

// https://www.pulumi.com/docs/reference/pkg/aws/iam/rolepolicyattachment/

export const lambdaRoleExecuteAccess = new aws.iam.RolePolicyAttachment('lambda-execute-access', {
  role: lambdaRole.name,
  policyArn: aws.iam.ManagedPolicy.AWSLambdaExecute,
})

export const lambdaRoleDynamodbAccess = new aws.iam.RolePolicyAttachment('lambda-dynamodb-access', {
  role: lambdaRole.name,
  policyArn: accessDynamodbPolicy.arn,
})

export const lambdaKmsAccess = new aws.iam.RolePolicyAttachment('lambda-kms-access', {
  role: lambdaRole.name,
  policyArn: lambdaKmsAccessPolicy.arn,
})

export const cloudwatchLogAccess = new aws.iam.RolePolicyAttachment('cloudwatch-log-access', {
  role: cloudwatchLogRole.name,
  policyArn: aws.iam.ManagedPolicy.AmazonAPIGatewayPushToCloudWatchLogs,
})
