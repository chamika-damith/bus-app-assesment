import { RegisterDataSchema } from '../types';

describe('Role Validation', () => {
  it('should accept valid uppercase role values', () => {
    const validData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'PASSENGER' as const,
    };

    expect(() => RegisterDataSchema.parse(validData)).not.toThrow();
  });

  it('should accept all valid role values', () => {
    const roles = ['PASSENGER', 'DRIVER', 'ADMIN'] as const;
    
    roles.forEach(role => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role,
      };

      expect(() => RegisterDataSchema.parse(validData)).not.toThrow();
    });
  });

  it('should reject invalid role values', () => {
    const invalidData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'passenger', // lowercase - should fail
    };

    expect(() => RegisterDataSchema.parse(invalidData)).toThrow();
  });

  it('should reject completely invalid role values', () => {
    const invalidData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'INVALID_ROLE',
    };

    expect(() => RegisterDataSchema.parse(invalidData)).toThrow();
  });

  it('should require either email or phone', () => {
    const dataWithoutEmailOrPhone = {
      password: 'password123',
      name: 'Test User',
      role: 'PASSENGER' as const,
    };

    expect(() => RegisterDataSchema.parse(dataWithoutEmailOrPhone)).toThrow();
  });

  it('should accept phone instead of email', () => {
    const dataWithPhone = {
      phone: '+1234567890',
      password: 'password123',
      name: 'Test User',
      role: 'PASSENGER' as const,
    };

    expect(() => RegisterDataSchema.parse(dataWithPhone)).not.toThrow();
  });
});