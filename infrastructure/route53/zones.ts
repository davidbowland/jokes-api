import * as aws from '@pulumi/aws'

import { domainName } from '@vars'

// https://www.pulumi.com/registry/packages/aws/api-docs/route53/getzone/

export const zone = aws.route53.getZone({
  name: domainName,
})
