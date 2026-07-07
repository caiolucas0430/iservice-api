import { Test, TestingModule } from '@nestjs/testing';
import { HelpController } from './help.controller';
import { HelpService } from './help.service';

describe('HelpController', () => {
  let controller: HelpController;
  let service: HelpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HelpController],
      providers: [
        {
          provide: HelpService,
          useValue: {
            getFaq: jest
              .fn()
              .mockReturnValue([{ id: 1, question: 'Q', answer: 'A' }]),
          },
        },
      ],
    }).compile();

    controller = module.get<HelpController>(HelpController);
    service = module.get<HelpService>(HelpService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFaq', () => {
    it('should call helpService.getFaq and return its result', () => {
      const getFaqSpy = jest.spyOn(service, 'getFaq');
      const result = controller.getFaq();
      expect(getFaqSpy).toHaveBeenCalled();
      expect(result).toEqual([{ id: 1, question: 'Q', answer: 'A' }]);
    });
  });
});
