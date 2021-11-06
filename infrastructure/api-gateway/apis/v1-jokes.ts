import * as awsx from '@pulumi/awsx'

import { zip_v1_jokes_handler } from '../../lambda/functions'
import { cognitoUserPoolArn, resourceById, resourcePlain, resourceRandom } from '../../vars'

// https://www.pulumi.com/docs/reference/pkg/nodejs/pulumi/awsx/apigateway/

const cognito_authorizer = awsx.apigateway.getCognitoAuthorizer({
  providerARNs: [cognitoUserPoolArn],
})

export const jokes_handler_api = new awsx.apigateway.API('lambda-jokes-handler-api-v1', {
  stageName: 'v1',
  routes: [
    // By ID
    {
      authorizers: [cognito_authorizer],
      path: resourceById,
      method: 'GET',
      eventHandler: zip_v1_jokes_handler,
    },
    {
      authorizers: [cognito_authorizer],
      path: resourceById,
      method: 'PUT',
      eventHandler: zip_v1_jokes_handler,
    },
    {
      authorizers: [cognito_authorizer],
      path: resourceById,
      method: 'DELETE',
      eventHandler: zip_v1_jokes_handler,
    },
    {
      path: resourceById,
      method: 'OPTIONS',
      eventHandler: zip_v1_jokes_handler,
    },
    // Plain
    {
      authorizers: [cognito_authorizer],
      path: resourcePlain,
      method: 'GET',
      eventHandler: zip_v1_jokes_handler,
    },
    {
      authorizers: [cognito_authorizer],
      path: resourcePlain,
      method: 'POST',
      eventHandler: zip_v1_jokes_handler,
    },
    {
      path: resourcePlain,
      method: 'OPTIONS',
      eventHandler: zip_v1_jokes_handler,
    },
    // Random
    {
      path: resourceRandom,
      method: 'GET',
      eventHandler: zip_v1_jokes_handler,
    },
    {
      path: resourceRandom,
      method: 'OPTIONS',
      eventHandler: zip_v1_jokes_handler,
    },
  ],
  gatewayResponses: {
    UNAUTHORIZED: {
      statusCode: 401,
      responseTemplates: {
        'application/json': '{"message":$context.error.messageString}',
      },
      responseParameters: {
        'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
        'gatewayresponse.header.Access-Control-Allow-Headers':
          "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
        'gatewayresponse.header.Access-Control-Allow-Methods': "'OPTIONS,GET,POST,PUT,DELETE'",
        'gatewayresponse.header.Access-Control-Allow-Credentials': "'*'",
      },
    },
  },
})
