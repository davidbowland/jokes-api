import AWSXRay from 'aws-xray-sdk-core'

export const extractRequestError = (message: string): { errors?: any; message?: string } => {
  try {
    return { errors: JSON.parse(message) }
  } catch (e: any) {
    return { message }
  }
}

export const log = (...args: any[]): unknown => console.log(...args)

export const logError = (...args: any[]): unknown => console.error(...args)

export const xrayCapture = (x: any) => (process.env.AWS_SAM_LOCAL === 'true' ? x : AWSXRay.captureAWSv3Client(x))
