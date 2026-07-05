/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import { IFile } from '../common/interfaces/file.interface';

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadService],
    }).compile();

    service = module.get<UploadService>(UploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return empty string if no file is provided', async () => {
    const result = await service.uploadFile(null as any);
    expect(result).toBe('');
  });

  it('should return a dummy URL when file is provided', async () => {
    const mockFile: IFile = {
      fieldname: 'avatar',
      originalname: 'test-image.png',
      encoding: '7bit',
      mimetype: 'image/png',
      buffer: Buffer.from([]),
      size: 0,
    };

    const result = await service.uploadFile(mockFile);
    expect(result).toContain('https://dummyimage.com');
    expect(result).toContain('testimagepng');
  });

  it('should fallback to default filename if originalname is missing', async () => {
    const mockFile: IFile = {
      fieldname: 'avatar',
      encoding: '7bit',
      mimetype: 'image/png',
      buffer: Buffer.from([]),
      size: 0,
    } as any;

    const result = await service.uploadFile(mockFile);
    expect(result).toContain('https://dummyimage.com');
    expect(result).toContain('file');
  });
});
