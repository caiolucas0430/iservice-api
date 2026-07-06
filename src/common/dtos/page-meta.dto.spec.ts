import { PageMetaDto } from './page-meta.dto';
import { PageOptionsDto } from './page-options.dto';

describe('PageMetaDto', () => {
  const buildPageOptions = (page: number, take: number): PageOptionsDto => {
    const dto = new PageOptionsDto();
    Object.assign(dto, { page, take });
    return dto;
  };

  it('calcula pageCount arredondando para cima', () => {
    const meta = new PageMetaDto({
      pageOptionsDto: buildPageOptions(1, 10),
      itemCount: 25,
    });

    expect(meta.pageCount).toBe(3);
  });

  it('hasPreviousPage é falso e hasNextPage é verdadeiro na primeira página', () => {
    const meta = new PageMetaDto({
      pageOptionsDto: buildPageOptions(1, 10),
      itemCount: 25,
    });

    expect(meta.hasPreviousPage).toBe(false);
    expect(meta.hasNextPage).toBe(true);
  });

  it('hasPreviousPage é verdadeiro e hasNextPage é falso na última página', () => {
    const meta = new PageMetaDto({
      pageOptionsDto: buildPageOptions(3, 10),
      itemCount: 25,
    });

    expect(meta.hasPreviousPage).toBe(true);
    expect(meta.hasNextPage).toBe(false);
  });

  it('trata itemCount igual a zero sem gerar páginas', () => {
    const meta = new PageMetaDto({
      pageOptionsDto: buildPageOptions(1, 10),
      itemCount: 0,
    });

    expect(meta.pageCount).toBe(0);
    expect(meta.hasPreviousPage).toBe(false);
    expect(meta.hasNextPage).toBe(false);
  });

  it('expõe page, take e itemCount recebidos', () => {
    const meta = new PageMetaDto({
      pageOptionsDto: buildPageOptions(2, 15),
      itemCount: 40,
    });

    expect(meta.page).toBe(2);
    expect(meta.take).toBe(15);
    expect(meta.itemCount).toBe(40);
  });
});
