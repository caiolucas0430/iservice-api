import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateProfileDto } from './update-profile.dto';
import { ProfileMessages } from '../users.messages';

/**
 * Testes de Unidade - US02 / RN05 (Validação de Telefone).
 * Base de evidência para o teste de aceitação TA02.04.
 */
describe('UpdateProfileDto - validação de telefone', () => {
  const build = (data: Partial<UpdateProfileDto>) =>
    plainToInstance(UpdateProfileDto, data);

  const validPhones = [
    '(84) 99999-9999',
    '84999999999',
    '+55 84 99999-9999',
    '84 3211-1234',
    '8432111234',
  ];

  const invalidPhones = ['123', 'telefone', '99', 'abc-defg', '()'];

  it.each(validPhones)('aceita telefone válido: %s', async (phone) => {
    const errors = await validate(build({ phoneNumber: phone }));
    expect(errors.length).toBe(0);
  });

  it.each(invalidPhones)(
    'rejeita telefone inválido "%s" com MSG04',
    async (phone) => {
      const errors = await validate(build({ phoneNumber: phone }));
      expect(errors.length).toBeGreaterThan(0);

      const messages = errors.flatMap((e) =>
        Object.values(e.constraints ?? {}),
      );
      expect(messages).toContain(ProfileMessages.INVALID_PHONE);
    },
  );

  it('permite ausência de telefone (campo opcional)', async () => {
    const errors = await validate(build({ bio: 'perfil sem telefone' }));
    expect(errors.length).toBe(0);
  });
});
