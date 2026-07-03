import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { Order, PageOptionsDto } from './page-options.dto';

describe('PageOptionsDto', () => {
  describe('valores padrão', () => {
    it('aplica order=ASC, page=1 e take=10 quando nada é informado', () => {
      const dto = new PageOptionsDto();

      expect(dto.order).toBe(Order.ASC);
      expect(dto.page).toBe(1);
      expect(dto.take).toBe(10);
    });

    it('não gera erros de validação com os valores padrão', async () => {
      const errors = await validate(new PageOptionsDto());
      expect(errors.length).toBe(0);
    });
  });

  describe('getter skip', () => {
    it.each([
      [1, 10, 0],
      [2, 10, 10],
      [3, 25, 50],
    ])('page=%i, take=%i => skip=%i', (page, take, expected) => {
      const dto = plainToInstance(PageOptionsDto, { page, take });
      expect(dto.skip).toBe(expected);
    });
  });

  describe('validação', () => {
    it('rejeita order fora do enum', async () => {
      const dto = plainToInstance(PageOptionsDto, { order: 'INVALID' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'order')).toBe(true);
    });

    it('rejeita page menor que 1', async () => {
      const dto = plainToInstance(PageOptionsDto, { page: 0 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'page')).toBe(true);
    });

    it('rejeita page não inteiro', async () => {
      const dto = plainToInstance(PageOptionsDto, { page: 1.5 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'page')).toBe(true);
    });

    it('rejeita take menor que 1', async () => {
      const dto = plainToInstance(PageOptionsDto, { take: 0 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'take')).toBe(true);
    });

    it('rejeita take maior que 50', async () => {
      const dto = plainToInstance(PageOptionsDto, { take: 51 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'take')).toBe(true);
    });

    it('aceita order, page e take válidos', async () => {
      const dto = plainToInstance(PageOptionsDto, {
        order: Order.DESC,
        page: 2,
        take: 50,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
