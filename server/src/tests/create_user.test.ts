
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'staf_komisi',
  phone: '+6281234567890',
  password: 'password123'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with all fields', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
    expect(result.full_name).toEqual('Test User');
    expect(result.role).toEqual('staf_komisi');
    expect(result.phone).toEqual('+6281234567890');
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database with hashed password', async () => {
    const result = await createUser(testInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    
    const savedUser = users[0];
    expect(savedUser.username).toEqual('testuser');
    expect(savedUser.email).toEqual('test@example.com');
    expect(savedUser.full_name).toEqual('Test User');
    expect(savedUser.role).toEqual('staf_komisi');
    expect(savedUser.phone).toEqual('+6281234567890');
    expect(savedUser.is_active).toBe(true);
    expect(savedUser.password_hash).toBeDefined();
    expect(savedUser.password_hash).not.toEqual('password123'); // Password should be hashed
    expect(savedUser.created_at).toBeInstanceOf(Date);
    expect(savedUser.updated_at).toBeInstanceOf(Date);
  });

  it('should hash password correctly', async () => {
    const result = await createUser(testInput);

    // Get the stored password hash
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    const storedPasswordHash = users[0].password_hash;

    // Verify the password can be validated with Bun's password verification
    const isPasswordValid = await Bun.password.verify('password123', storedPasswordHash);
    expect(isPasswordValid).toBe(true);

    // Verify wrong password fails
    const isWrongPasswordValid = await Bun.password.verify('wrongpassword', storedPasswordHash);
    expect(isWrongPasswordValid).toBe(false);
  });

  it('should create user with nullable phone', async () => {
    const inputWithoutPhone: CreateUserInput = {
      ...testInput,
      phone: null
    };

    const result = await createUser(inputWithoutPhone);

    expect(result.phone).toBeNull();
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
  });

  it('should handle different user roles', async () => {
    const roles = ['staf_komisi', 'komisioner', 'panitera', 'pemohon', 'badan_publik'] as const;

    for (const role of roles) {
      const roleInput: CreateUserInput = {
        ...testInput,
        username: `user_${role}`,
        email: `${role}@example.com`,
        role: role
      };

      const result = await createUser(roleInput);
      expect(result.role).toEqual(role);
      expect(result.username).toEqual(`user_${role}`);
    }
  });

  it('should fail with duplicate username', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create second user with same username
    const duplicateInput: CreateUserInput = {
      ...testInput,
      email: 'different@example.com' // Different email but same username
    };

    await expect(createUser(duplicateInput)).rejects.toThrow();
  });

  it('should fail with duplicate email', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create second user with same email
    const duplicateInput: CreateUserInput = {
      ...testInput,
      username: 'differentuser' // Different username but same email
    };

    await expect(createUser(duplicateInput)).rejects.toThrow();
  });
});
