import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateUserDto } from './create-user.dto.js';

describe('CreateUserDto Validations', () => {
  const validPayload = {
    fullName: 'Juan Perez',
    email: 'juan.perez@example.com',
    phoneNumber: '+54 9 11 1234 5678',
    roles: ['USER'],
  };

  it('debe pasar la validación con un payload válido', async () => {
    const dto = plainToInstance(CreateUserDto, validPayload);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  describe('fullName', () => {
    it('debe fallar si fullName está ausente o vacío', async () => {
      const dto = plainToInstance(CreateUserDto, { ...validPayload, fullName: '' });
      const errors = await validate(dto);
      const nameErrors = errors.find((e) => e.property === 'fullName');
      expect(nameErrors).toBeDefined();
    });

    it('debe permitir un fullName de exactamente 255 caracteres', async () => {
      const dto = plainToInstance(CreateUserDto, {
        ...validPayload,
        fullName: 'A'.repeat(255),
      });
      const errors = await validate(dto);
      const nameErrors = errors.find((e) => e.property === 'fullName');
      expect(nameErrors).toBeUndefined();
    });

    it('debe fallar si fullName excede los 255 caracteres', async () => {
      const dto = plainToInstance(CreateUserDto, {
        ...validPayload,
        fullName: 'A'.repeat(256),
      });
      const errors = await validate(dto);
      const nameErrors = errors.find((e) => e.property === 'fullName');
      expect(nameErrors?.constraints?.['maxLength']).toBeDefined();
    });
  });

  describe('email', () => {
    it('debe fallar si email está ausente o vacío', async () => {
      const dto = plainToInstance(CreateUserDto, { ...validPayload, email: '' });
      const errors = await validate(dto);
      const emailErrors = errors.find((e) => e.property === 'email');
      expect(emailErrors).toBeDefined();
    });

    it('debe fallar si email no tiene formato de correo válido', async () => {
      const dto = plainToInstance(CreateUserDto, { ...validPayload, email: 'correo-invalido' });
      const errors = await validate(dto);
      const emailErrors = errors.find((e) => e.property === 'email');
      expect(emailErrors?.constraints?.['isEmail']).toBeDefined();
    });

    it('debe fallar si email excede los 255 caracteres', async () => {
      const longEmail = `${'a'.repeat(250)}@example.com`;
      const dto = plainToInstance(CreateUserDto, { ...validPayload, email: longEmail });
      const errors = await validate(dto);
      const emailErrors = errors.find((e) => e.property === 'email');
      expect(emailErrors?.constraints?.['maxLength']).toBeDefined();
    });

    it('debe permitir un email válido dentro de los 255 caracteres', async () => {
      const dto = plainToInstance(CreateUserDto, {
        ...validPayload,
        email: 'usuario.corporativo.valido@empresa.com.ar',
      });
      const errors = await validate(dto);
      const emailErrors = errors.find((e) => e.property === 'email');
      expect(emailErrors).toBeUndefined();
    });
  });

  describe('phoneNumber', () => {
    it('debe permitir que phoneNumber sea omitido (opcional)', async () => {
      const { phoneNumber, ...payloadWithoutPhone } = validPayload;
      const dto = plainToInstance(CreateUserDto, payloadWithoutPhone);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe permitir un phoneNumber válido de hasta 50 caracteres', async () => {
      const phone50 = '+54' + '9'.repeat(47);
      expect(phone50.length).toBe(50);
      const dto = plainToInstance(CreateUserDto, { ...validPayload, phoneNumber: phone50 });
      const errors = await validate(dto);
      const phoneErrors = errors.find((e) => e.property === 'phoneNumber');
      expect(phoneErrors).toBeUndefined();
    });

    it('debe fallar si phoneNumber excede los 50 caracteres', async () => {
      const phone51 = '+54' + '9'.repeat(48);
      expect(phone51.length).toBe(51);
      const dto = plainToInstance(CreateUserDto, { ...validPayload, phoneNumber: phone51 });
      const errors = await validate(dto);
      const phoneErrors = errors.find((e) => e.property === 'phoneNumber');
      expect(phoneErrors?.constraints?.['maxLength']).toBeDefined();
    });

    it('debe fallar si phoneNumber contiene caracteres no permitidos', async () => {
      const dto = plainToInstance(CreateUserDto, { ...validPayload, phoneNumber: 'abc-123-xyz' });
      const errors = await validate(dto);
      const phoneErrors = errors.find((e) => e.property === 'phoneNumber');
      expect(phoneErrors?.constraints?.['matches']).toBeDefined();
    });
  });

  describe('roles', () => {
    it('debe fallar si roles no se provee o es un arreglo vacío', async () => {
      const dtoEmpty = plainToInstance(CreateUserDto, { ...validPayload, roles: [] });
      const errorsEmpty = await validate(dtoEmpty);
      const roleErrorsEmpty = errorsEmpty.find((e) => e.property === 'roles');
      expect(roleErrorsEmpty?.constraints?.['arrayNotEmpty']).toBeDefined();

      const dtoMissing = plainToInstance(CreateUserDto, {
        fullName: validPayload.fullName,
        email: validPayload.email,
      });
      const errorsMissing = await validate(dtoMissing);
      const roleErrorsMissing = errorsMissing.find((e) => e.property === 'roles');
      expect(roleErrorsMissing).toBeDefined();
    });

    it('debe pasar si roles contiene al menos un rol como cadena de texto', async () => {
      const dto = plainToInstance(CreateUserDto, { ...validPayload, roles: ['USER'] });
      const errors = await validate(dto);
      const roleErrors = errors.find((e) => e.property === 'roles');
      expect(roleErrors).toBeUndefined();
    });
  });
});
