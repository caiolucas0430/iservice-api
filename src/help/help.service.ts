import { Injectable } from '@nestjs/common';

@Injectable()
export class HelpService {
  getFaq() {
    return [
      {
        id: 1,
        question: 'Como criar uma solicitação de serviço?',
        answer: 'Acesse a tela de serviços e clique em "Nova solicitação".',
      },
      {
        id: 2,
        question: 'Como alterar minha senha?',
        answer: 'Acesse seu perfil e selecione "Alterar senha".',
      },
      {
        id: 3,
        question: 'Como entrar em contato com o suporte?',
        answer: 'Utilize o menu Ajuda para falar com o suporte.',
      },
    ];
  }
}
