import client from '../config/s3.config.js'
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME
// Class  to handle uploading files
class FileService {
  // Upload file
  static async uploadFile (file) {
    try {
      const brand = uuidv4()
      const uniqueFileName = `${brand}_${file.originalname}`
      const command = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: uniqueFileName,
        Body: file.buffer,
        ContentType: file.mimetype
      })
      const response = await client.send(command)
      return { response, uniqueFileName }
    } catch (error) {
      console.error('Error uploading file:', error)
      throw new Error('Error uploading file')
    }
  }

  // Get file
  static async getFile (fileKey) {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileKey
      })
      const expiresUrl = 432000
      const presignedUrl = await getSignedUrl(client, command, { expiresIn: expiresUrl })
      return presignedUrl
    } catch (error) {
      console.error('Error generating presigned URL:', error)
      throw new Error('Error generating presigned URL')
    }
  }
}

export default FileService