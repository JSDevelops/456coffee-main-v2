import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { randomBytes } from 'crypto';
import type { Request } from 'express';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

// NOTE: Local disk storage. Fine for dev / single-instance deploys.
// For Render free tier (ephemeral disk) and multi-instance setups, swap to
// S3 / Cloudinary / Supabase Storage by replacing diskStorage with a custom
// engine that uploads to the cloud provider.
@Controller('api/uploads')
export class UploadController {
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!existsSync(UPLOAD_DIR)) {
            mkdirSync(UPLOAD_DIR, { recursive: true });
          }
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const id = randomBytes(8).toString('hex');
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${Date.now()}-${id}${ext}`);
        },
      }),
      limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
      fileFilter: (_req, file, cb) => {
        if (!/\.(jpe?g|png|gif|webp|avif|svg)$/i.test(file.originalname)) {
          cb(
            new BadRequestException(
              'รองรับเฉพาะไฟล์รูปภาพ (jpg/png/gif/webp/avif/svg)',
            ),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const host = `${req.protocol}://${req.get('host')}`;
    return {
      url: `${host}/uploads/${file.filename}`,
      filename: file.filename,
      size: file.size,
      mime: file.mimetype,
    };
  }
}
