import AWSXRay from 'aws-xray-sdk-core'

export const extractRequestError = (message: string): { errors?: Error; message?: string } => {
  try {
    return { errors: JSON.parse(message) }
  } catch (e: unknown) {
    return { message }
  }
}

export const log = (...args: unknown[]): unknown => console.log(...args)

export const logError = (...args: unknown[]): unknown => console.error(...args)

export const xrayCapture = (x: any) => (process.env.AWS_SAM_LOCAL === 'true' ? x : AWSXRay.captureAWSv3Client(x))
