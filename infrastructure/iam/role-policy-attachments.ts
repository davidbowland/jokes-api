import * as aws from '@pulumi/aws'

import { joke_access_dynamodb_policy, lambda_kms_access_policy } from './policies'
import { cloudwatch_log_role, lambda_role } from './roles'

// https://www.pulumi.com/docs/reference/pkg/aws/iam/rolepolicyattachment/

export const lambda_role_execute_access = new aws.iam.RolePolicyAttachment('lambda-execute-access', {
  role: lambda_role.name,
  policyArn: aws.iam.ManagedPolicy.AWSLambdaExecute,
})

export const lambda_role_dynamodb_access = new aws.iam.RolePolicyAttachment('lambda-dynamodb-access', {
  role: lambda_role.name,
  policyArn: joke_access_dynamodb_policy.arn,
})

export const lambda_kms_access = new aws.iam.RolePolicyAttachment('lambda-kms-access', {
  role: lambda_role.name,
  policyArn: lambda_kms_access_policy.arn,
})

export const cloudwatch_log_access = new aws.iam.RolePolicyAttachment('cloudwatch-log-access', {
  role: cloudwatch_log_role.name,
  policyArn: aws.iam.ManagedPolicy.AmazonAPIGatewayPushToCloudWatchLogs,
})
