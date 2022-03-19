import {
  Controller,
  Post,
  Body,
  UseGuards,
  Inject,
  UseInterceptors,
  UploadedFile,
  Delete,
  LoggerService,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ImageDto } from './dto/images.dto';
import { ImageService } from './image.service';
import { FileUploadService } from '../file-upload/file-upload.service';

@Controller('image')
export class ImageController {
  constructor(
    private readonly logger: LoggerService,
    private readonly imageService: ImageService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post('secure-image')
  @UseInterceptors(
    FileInterceptor('image', {
      // storage: memoryStorage(),
      limits: { fileSize: 1024 * 1024 * 10 },
    }),
  )
  async uploadSecureImageToS3(
    @Body() body: SecureImageDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.logger.log(`[Post] image/secure-image`);
    const { service, type } = body;

    const uploaded = await this.fileUploadService.uploadSecureImageToS3(file);
    const secureImage = await this.imageService.addSecureImage(
      service,
      type,
      uploaded,
    );
    return { data: secureImage };
  }

  @Delete('secure-image')
  async deleteSecureImage(@Body() body: SecureImageDto) {
    const { service, type } = body;
    const result = await this.imageService.deleteSecureImage(
      service,
      type,
      user.uuid,
    );
    return result;
  }
}
