import * as aws from '@pulumi/aws'

import { acmCertificateArn, apiHostname, createdBy, createdFor } from '@vars'

// https://www.pulumi.com/registry/packages/aws/api-docs/apigateway/domainname/

export const apiDomain = new aws.apigateway.DomainName('v1-api-domain', {
  certificateArn: acmCertificateArn,
  domainName: apiHostname,
  endpointConfiguration: {
    types: 'EDGE',
  },
  securityPolicy: 'TLS_1_2',
  tags: {
    'created-by': createdBy,
    'created-for': createdFor,
  },
})
