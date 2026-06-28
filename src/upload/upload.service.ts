import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
  /**
   * Faz o upload do arquivo para o serviço de cloud.
   * Mock: no momento retorna uma URL local ou dummy simulando o upload real.
   */
  async uploadFile(file: any): Promise<string> {
    if (!file) return '';
    
    // Simulate an upload delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Return a dummy URL (in a real scenario, this would be the S3 or Cloudinary URL)
    const randomId = Math.floor(Math.random() * 10000);
    return `https://dummyimage.com/600x400/000/fff&text=${file.originalname?.replace(/[^a-zA-Z0-9]/g, '') || 'file'}_${randomId}`;
  }
}


