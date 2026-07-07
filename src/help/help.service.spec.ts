import { Test, TestingModule } from '@nestjs/testing';
import { HelpService } from './help.service';

describe('HelpService', () => {
  let service: HelpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HelpService],
    }).compile();

    service = module.get<HelpService>(HelpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFaq', () => {
    it('should return an array of FAQs', () => {
      const result = service.getFaq();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('question');
      expect(result[0]).toHaveProperty('answer');
    });
  });
});
