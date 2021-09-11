/* General */

export const awsAccountNumber = process.env.AWS_ACCOUNT_NUMBER

export const lambdaTimeoutInSeconds = 15
export const resourcePlain = '/jokes'
export const resourceById = `${resourcePlain}/{jokeId}`
export const resourceRandom = `${resourcePlain}/random`

/* Infrastructure */

export const createdBy = 'lambda-jokes-handler'
export const createdFor = 'dbowland-jokes'

export const cognitoUserPoolArn = `arn:aws:cognito-idp:us-east-2:${awsAccountNumber}:userpool/us-east-2_qLm8nyPfO`
export const environmentVariableKmsArn = 'arn:aws:kms:*:*:key/aws/lambda'
export const lambdaSourceBucket = 'joke-lambda-source'

/* Lambda */

export const defaultOrigin = 'https://dbowland.com'
export const corsOrigins = `${defaultOrigin},http://localhost:8000`
export const fetchCountMaximum = '10'
export const jokeTableReferenceIndex = '0'
