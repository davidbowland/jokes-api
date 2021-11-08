import * as awsx from '@pulumi/awsx'

import { cognitoAuthorizer } from '../authorizers'
import { zipV1JokesHandler } from '../../lambda/functions'
import { resourceById, resourcePlain, resourceRandom } from '../../vars'

// https://www.pulumi.com/docs/reference/pkg/nodejs/pulumi/awsx/apigateway/

export const jokesHandlerApi = new awsx.apigateway.API('lambda-jokes-handler-api-v1', {
  stageName: 'v1',
  routes: [
    // By ID
    {
      authorizers: [cognitoAuthorizer],
      path: resourceById,
      method: 'GET',
      eventHandler: zipV1JokesHandler,
    },
    {
      authorizers: [cognitoAuthorizer],
      path: resourceById,
      method: 'PUT',
      eventHandler: zipV1JokesHandler,
    },
    {
      authorizers: [cognitoAuthorizer],
      path: resourceById,
      method: 'DELETE',
      eventHandler: zipV1JokesHandler,
    },
    {
      path: resourceById,
      method: 'OPTIONS',
      eventHandler: zipV1JokesHandler,
    },
    // Plain
    {
      authorizers: [cognitoAuthorizer],
      path: resourcePlain,
      method: 'GET',
      eventHandler: zipV1JokesHandler,
    },
    {
      authorizers: [cognitoAuthorizer],
      path: resourcePlain,
      method: 'POST',
      eventHandler: zipV1JokesHandler,
    },
    {
      path: resourcePlain,
      method: 'OPTIONS',
      eventHandler: zipV1JokesHandler,
    },
    // Random
    {
      path: resourceRandom,
      method: 'GET',
      eventHandler: zipV1JokesHandler,
    },
    {
      path: resourceRandom,
      method: 'OPTIONS',
      eventHandler: zipV1JokesHandler,
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
