import * as aws from '@pulumi/aws'

import { apiDomain } from '@api-gateway'
import { apiHostname } from '@vars'
import { zone } from './zones'

// https://www.pulumi.com/registry/packages/aws/api-docs/route53/record/

export const jokesBowlandLink = new aws.route53.Record('jokes-api-bowland-link', {
  aliases: [
    {
      evaluateTargetHealth: false,
      name: apiDomain.cloudfrontDomainName,
      zoneId: apiDomain.cloudfrontZoneId,
    },
  ],
  name: apiHostname,
  type: 'A',
  zoneId: zone.then((zone) => zone.id),
})
