import { PageDto } from './page.dto';
import { PageMetaDto } from './page-meta.dto';
import { PageOptionsDto } from './page-options.dto';

describe('PageDto', () => {
  it('armazena os dados e os metadados recebidos', () => {
    const pageOptionsDto = new PageOptionsDto();
    const meta = new PageMetaDto({ pageOptionsDto, itemCount: 2 });
    const data = [{ id: 1 }, { id: 2 }];

    const page = new PageDto(data, meta);

    expect(page.data).toBe(data);
    expect(page.meta).toBe(meta);
  });

  it('funciona com uma lista de dados vazia', () => {
    const pageOptionsDto = new PageOptionsDto();
    const meta = new PageMetaDto({ pageOptionsDto, itemCount: 0 });

    const page = new PageDto([], meta);

    expect(page.data).toEqual([]);
    expect(page.meta.itemCount).toBe(0);
  });
});
