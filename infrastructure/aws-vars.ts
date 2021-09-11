import { S3 } from 'aws-sdk'

import { lambdaSourceBucket } from './vars'

const s3 = new S3({ apiVersion: '2006-03-01' })

export const getMostRecentLambdaVersion = async (key: string): Promise<string> => {
  const v1JokesHandlerParams = {
    Bucket: lambdaSourceBucket,
    Key: key,
  }
  try {
    const response = await s3.headObject(v1JokesHandlerParams).promise()
    return response.VersionId ?? ''
  } catch (error) {
    console.error(error)
  }
  return ''
}
