import { AWS_SECRET_ACCESS_KEY, AWS_ACCESS_KEY_ID } from './variables.config.js'
import { S3Client } from '@aws-sdk/client-s3'

const AWS_REGION = process.env.AWS_REGION
const client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
})

export default client