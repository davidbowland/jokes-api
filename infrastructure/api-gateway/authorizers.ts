import * as awsx from '@pulumi/awsx'

import { cognitoUserPoolArn } from '@vars'

// https://www.pulumi.com/docs/reference/pkg/aws/apigateway/authorizer/

export const cognitoAuthorizer = awsx.apigateway.getCognitoAuthorizer({
  providerARNs: [cognitoUserPoolArn],
})
