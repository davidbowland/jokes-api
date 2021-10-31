/* General */

export const awsAccountId = process.env.AWS_ACCOUNT_ID

export const lambdaTimeoutInSeconds = 15
export const resourcePlain = '/jokes'
export const resourceById = `${resourcePlain}/{jokeId}`
export const resourceRandom = `${resourcePlain}/random`

/* Infrastructure */

export const createdBy = 'lambda-jokes-handler'
export const createdFor = 'dbowland-jokes'

export const cognitoUserPoolArn = `arn:aws:cognito-idp:us-east-2:${awsAccountId}:userpool/us-east-2_JLHXqBLCP`
export const environmentVariableKmsArn = 'arn:aws:kms:*:*:key/aws/lambda'
export const lambdaSourceBucket = 'jokes-lambda-source'

/* Lambda */

export const defaultOrigin = 'https://dbowland.com'
export const corsOrigins = `${defaultOrigin},https://d8m2rj7f9egv3.cloudfront.net`
export const fetchCountMaximum = '10'
export const jokeTableReferenceIndex = '0'
