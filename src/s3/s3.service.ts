import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  private readonly bucketName = process.env.AWS_BUCKET_NAME!;
  private readonly region = process.env.AWS_REGION!;
  private readonly publicBaseUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;

  async createPresignedUploadUrl(params: {
    key: string;
    contentType: string;
    expiresInSeconds?: number;
  }) {
    const { key, contentType, expiresInSeconds = 300 } = params;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: expiresInSeconds,
    });

    return {
      uploadUrl,
      fileUrl: `${this.publicBaseUrl}/${key}`,
      expiresInSeconds,
    };
  }
}
