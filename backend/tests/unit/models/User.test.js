const { Sequelize, DataTypes } = require('sequelize');
const createUserModel = require('../../../src/models/User');
const userFixtures = require('../../fixtures/users');

describe('User Model', () => {
  let sequelize;
  let User;

  beforeAll(async () => {
    // Create test database connection
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false
    });

    // Initialize User model
    User = createUserModel(sequelize);
    
    // Sync database
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up before each test
    await User.destroy({ where: {}, force: true });
  });

  describe('Model Definition', () => {
    test('should have correct attributes', () => {
      const attributes = User.getTableName ? Object.keys(User.rawAttributes) : Object.keys(User.getAttributes());
      
      expect(attributes).toContain('id');
      expect(attributes).toContain('name');
      expect(attributes).toContain('email');
      expect(attributes).toContain('phoneNumber');
      expect(attributes).toContain('passwordHash');
      expect(attributes).toContain('createdAt');
      expect(attributes).toContain('updatedAt');
    });

    test('should have UUID primary key', () => {
      const idAttribute = User.rawAttributes.id;
      expect(idAttribute.type).toBeInstanceOf(DataTypes.UUID);
      expect(idAttribute.primaryKey).toBe(true);
      expect(idAttribute.defaultValue).toBe(DataTypes.UUIDV4);
    });

    test('should exclude passwordHash from default scope', () => {
      const defaultScope = User.options.defaultScope;
      expect(defaultScope.attributes.exclude).toContain('passwordHash');
    });
  });

  describe('Validation', () => {
    test('should create user with valid data', async () => {
      const userData = await userFixtures.createUserWithHashedPassword(userFixtures.validUser);
      
      const user = await User.create(userData);
      
      expect(user.id).toBeDefined();
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.phoneNumber).toBe(userData.phoneNumber);
      expect(user.passwordHash).toBeUndefined(); // Should be excluded by default scope
    });

    test('should require name', async () => {
      const userData = await userFixtures.createUserWithHashedPassword(userFixtures.invalidUsers.missingName);
      
      await expect(User.create(userData)).rejects.toThrow();
    });

    test('should require email', async () => {
      const userData = await userFixtures.createUserWithHashedPassword(userFixtures.invalidUsers.missingEmail);
      
      await expect(User.create(userData)).rejects.toThrow();
    });

    test('should validate email format', async () => {
      const userData = await userFixtures.createUserWithHashedPassword(userFixtures.invalidUsers.invalidEmail);
      
      await expect(User.create(userData)).rejects.toThrow();
    });

    test('should validate phone number format', async () => {
      const userData = await userFixtures.createUserWithHashedPassword(userFixtures.invalidUsers.invalidPhoneNumber);
      
      await expect(User.create(userData)).rejects.toThrow('Invalid phone number format');
    });

    test('should enforce unique email', async () => {
      const userData1 = await userFixtures.createUserWithHashedPassword(userFixtures.validUser);
      const userData2 = await userFixtures.createUserWithHashedPassword({
        ...userFixtures.validUserZA,
        email: userFixtures.validUser.email // Same email
      });

      await User.create(userData1);
      
      await expect(User.create(userData2)).rejects.toThrow();
    });

    test('should allow null phone number', async () => {
      const userData = await userFixtures.createUserWithHashedPassword({
        ...userFixtures.validUser,
        phoneNumber: null
      });
      
      const user = await User.create(userData);
      expect(user.phoneNumber).toBeNull();
    });

    test('should allow empty string phone number', async () => {
      const userData = await userFixtures.createUserWithHashedPassword({
        ...userFixtures.validUser,
        phoneNumber: ''
      });
      
      const user = await User.create(userData);
      expect(user.phoneNumber).toBe('');
    });
  });

  describe('Queries', () => {
    beforeEach(async () => {
      // Create test users
      const users = await userFixtures.createMultipleUsers(3);
      for (const userData of users) {
        await User.create(userData);
      }
    });

    test('should find user by email', async () => {
      const user = await User.findOne({ where: { email: 'testuser1@example.com' } });
      
      expect(user).toBeDefined();
      expect(user.email).toBe('testuser1@example.com');
      expect(user.passwordHash).toBeUndefined(); // Excluded by default scope
    });

    test('should include passwordHash when using unscoped', async () => {
      const user = await User.unscoped().findOne({ where: { email: 'testuser1@example.com' } });
      
      expect(user).toBeDefined();
      expect(user.passwordHash).toBeDefined();
    });

    test('should count total users', async () => {
      const count = await User.count();
      expect(count).toBe(3);
    });

    test('should find users by phone number pattern', async () => {
      const users = await User.findAll({
        where: {
          phoneNumber: {
            [sequelize.Sequelize.Op.like]: '+2712345678%'
          }
        }
      });
      
      expect(users.length).toBe(3);
    });
  });

  describe('Timestamps', () => {
    test('should set createdAt and updatedAt on creation', async () => {
      const userData = await userFixtures.createUserWithHashedPassword(userFixtures.validUser);
      
      const user = await User.create(userData);
      
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(user.updatedAt.getTime());
    });

    test('should update updatedAt on modification', async () => {
      const userData = await userFixtures.createUserWithHashedPassword(userFixtures.validUser);
      const user = await User.create(userData);
      
      const originalUpdatedAt = user.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await user.update({ name: 'Updated Name' });
      
      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});