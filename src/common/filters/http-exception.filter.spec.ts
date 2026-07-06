import {
  ArgumentsHost,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockRequest: { url: string };
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockRequest = { url: '/users/profile' };

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  it('formata a resposta com statusCode, timestamp, path e message (string)', () => {
    const exception = new NotFoundException('Usuário não encontrado');

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        path: '/users/profile',
        message: 'Usuário não encontrado',
      }),
    );
  });

  it('repassa mensagens em array quando a exceção possui múltiplas validações', () => {
    const exception = new BadRequestException([
      'Telefone inválido.',
      'Bio é obrigatória.',
    ]);

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: ['Telefone inválido.', 'Bio é obrigatória.'],
      }),
    );
  });

  it('usa a mensagem da própria exceção quando a resposta não possui "message"', () => {
    const exception = new NotFoundException();
    // simula uma getResponse() sem propriedade message (ex.: string simples)
    jest.spyOn(exception, 'getResponse').mockReturnValue('Not Found');

    filter.catch(exception, mockHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: exception.message }),
    );
  });

  it('inclui um timestamp ISO válido na resposta', () => {
    const exception = new NotFoundException('erro');

    filter.catch(exception, mockHost);

    const [payload] = mockResponse.json.mock.calls[0] as [
      { timestamp: string },
    ];
    expect(() => new Date(payload.timestamp).toISOString()).not.toThrow();
  });
});
