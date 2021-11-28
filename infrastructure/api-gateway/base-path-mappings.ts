import * as aws from '@pulumi/aws'

import { jokesHandlerApi } from './apis'
import { apiDomain } from './domain-names'

// This is called "API mappings" in the UI
// https://www.pulumi.com/registry/packages/aws/api-docs/apigateway/basepathmapping/

export const exampleBasePathMapping = new aws.apigateway.BasePathMapping('v1-api-base-path', {
  basePath: 'v1',
  domainName: apiDomain.domainName,
  restApi: jokesHandlerApi.restAPI.id,
  stageName: jokesHandlerApi.stage.stageName,
})
