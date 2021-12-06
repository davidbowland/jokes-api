/* General */

export const awsAccountId = process.env.AWS_ACCOUNT_ID
export const projectName = 'jokes'
export const domainName = 'bowland.link'
export const apiHostname = `${projectName}-api.${domainName}`

export const createdBy = `lambda-${projectName}-handler`
export const createdFor = projectName

/* Route 53 */

export const acmCertificateArn = `arn:aws:acm:us-east-1:${awsAccountId}:certificate/6a48cba7-feb9-4de5-8cbf-d383140fcdef`
export const cognitoUserPoolArn = `arn:aws:cognito-idp:us-east-2:${awsAccountId}:userpool/us-east-2_JLHXqBLCP`
export const environmentVariableKmsArn = 'arn:aws:kms:*:*:key/aws/lambda'
export const lambdaSourceBucket = `${projectName}-lambda-source`

/* Lambda */

export const defaultOrigin = `https://${projectName}.${domainName}`
export const corsOrigins = `${defaultOrigin}`
export const fetchCountMaximum = '10'
export const jokeTableReferenceIndex = '0'
export const lambdaTimeoutInSeconds = 15
export const resourcePlain = '/jokes'
export const resourceById = `${resourcePlain}/{jokeId}`
export const resourceRandom = `${resourcePlain}/random`
