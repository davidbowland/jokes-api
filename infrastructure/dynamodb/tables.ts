import * as aws from '@pulumi/aws'

import { createdBy, createdFor } from '@vars'

// https://www.pulumi.com/docs/reference/pkg/aws/dynamodb/table/

export const jokesTable = new aws.dynamodb.Table('dynamodb-table', {
  attributes: [
    {
      name: 'Index',
      type: 'N',
    },
  ],
  name: 'lambda-jokes-handler',
  billingMode: 'PAY_PER_REQUEST',
  hashKey: 'Index',
  tags: {
    'created-by': createdBy,
    'created-for': createdFor,
  },
})
