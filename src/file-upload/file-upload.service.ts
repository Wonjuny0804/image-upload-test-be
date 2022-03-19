import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import sharp from 'sharp';
import { S3Uploaded } from './dto/s3-uploaded.dto';

@Injectable()
export class FileUploadService {
  private s3: S3;
  constructor() {
    this.s3 = new S3({
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
      accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
      region: 'ap-northeast-2',
    });
  }

  public async uploadSecureImageToS3(file: Express.Multer.File) {
    const keyPrefix = 'secure';
    const now = Date.now().toString();
    const encodedFileName = Buffer.from(file.originalname).toString('base64');
    const resizedImage = await sharp(file.buffer)
      .resize({ width: 800 })
      .toFormat('png')
      .toBuffer();

    const uploaded = (await this.s3
      .upload({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `${keyPrefix}/${now}_${encodedFileName}.png`,
        ACL: 'private',
        Body: resizedImage,
        ContentType: 'image/png',
      })
      .promise()) as any;

    return {
      location: uploaded.Location,
      key: uploaded.Key,
      versionId: uploaded.VersionId,
      bucketName: uploaded.Bucket,
    } as S3Uploaded;
  }

  public async uploadProductImageToS3(file: Express.Multer.File) {
    const keyPrefix = 'commerce/product';
    const permission = 'public-read';
    const now = Date.now().toString();
    const encodedFileName = Buffer.from(file.originalname).toString('base64');
    const imageType = file.mimetype.split('/')[1];

    const uploaded = (await this.s3
      .upload({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `${keyPrefix}/${now}_${encodedFileName}}.${imageType}`,
        ACL: permission,
        Body: file.buffer,
        ContentType: `image/${imageType}`,
      })
      .promise()) as any;

    return {
      location: uploaded.Location,
      key: uploaded.Key,
      versionId: uploaded.VersionId,
      bucketName: uploaded.Bucket,
    };
  }

  public async deleteUploadedImageFromS3(key: string) {
    try {
      await this.s3
        .deleteObject({ Bucket: process.env.AWS_S3_BUCKET, Key: key })
        .promise();
    } catch (err) {
      throw err;
    }
  }
}
