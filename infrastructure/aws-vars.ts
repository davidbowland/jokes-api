import { S3 } from 'aws-sdk'

import { lambdaSourceBucket } from './vars'

const s3 = new S3({ apiVersion: '2006-03-01' })

// prettier-ignore
const handleErrorWithDefault =
  <Type>(value: Type) => (error: Error): Type => (console.error(error), value)

export const getMostRecentLambdaVersion = (key: string): Promise<string> =>
  s3
    .headObject({
      Bucket: lambdaSourceBucket,
      Key: key,
    })
    .promise()
    .then((response) => response.VersionId ?? '')
    .catch(handleErrorWithDefault(''))
