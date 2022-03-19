import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductImageDto } from 'src/admin-commerce/dto/product-image.dto';
import { ProductImage } from 'src/common/entities/product-image.entity';
import { PcrResult } from 'src/quarantine/entities/pcr-result.entity';
import { Connection, Repository } from 'typeorm';
import { S3Uploaded } from '../dto/s3-uploaded.dto';
import { SecureImage } from '../entities/secure-image.entity';

@Injectable()
export class ImageService {
  constructor(
    @InjectRepository(SecureImage)
    private secureImageRepository: Repository<SecureImage>,
    @InjectRepository(ProductImage)
    private productImageRepository: Repository<ProductImage>,
    private connection: Connection,
  ) {}

  async addSecureImage(
    service: string,
    type: string,
    uuid: string,
    uploaded: S3Uploaded,
  ) {
    return await this.secureImageRepository.save({
      service: service,
      type: type,
      userId: uuid,
      securityLevel: 0,
      ...uploaded,
    });
  }

  public async updateSecureImage(imageId: string, simOrderId: string) {
    try {
      const result = await this.secureImageRepository
        .createQueryBuilder()
        .update(SecureImage)
        .set({ serviceId: simOrderId })
        .where('uuid = :imageId', { imageId })
        .execute();
      if (result.affected < 1) throw new BadRequestException('Image Not Found');
      return result;
    } catch (err) {
      throw new BadRequestException('Update Image Info Failed');
    }
  }

  public async deleteSecureImage(service: string, type: string, uuid: string) {
    const images = await this.secureImageRepository.find({
      where: { service, type, userId: uuid },
    });
    if (!images) {
      throw new BadRequestException();
    }

    return await this.secureImageRepository.remove(images);
  }

  public async addProductImage(
    uploaded: S3Uploaded,
    fields?: ProductImageDto,
    productId?: number,
  ) {
    const hasProductId = productId ? productId : null;

    return await this.productImageRepository.save({
      ...uploaded,
      ...fields,
      productId: hasProductId,
    });
  }

  public async deleteProductImage(imageId: number) {
    const imageRecord = await this.productImageRepository.findOne({
      where: { id: imageId },
    });

    if (!imageRecord)
      throw new NotFoundException('Product image was not found');

    return await this.productImageRepository.remove(imageRecord);
  }
}
