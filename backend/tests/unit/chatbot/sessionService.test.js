/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: sessionService.test - test file for backend functionality
 */

const sessionService = require('../../../src/chat-bot/services/sessionService');

describe('Session Service', () => {
  beforeEach(async () => {
    // Clear sessions before each test
    await sessionService.clearAllSessions();
  });

  afterEach(async () => {
    // Clean up after each test
    await sessionService.clearAllSessions();
  });

  describe('Session Creation', () => {
    test('should create a new session with unique ID', async () => {
      const session = await sessionService.createSession('user123');
      expect(session.id).toBeDefined();
      expect(session.userId).toBe('user123');
      expect(session.createdAt).toBeDefined();
      expect(session.messages).toHaveLength(0);
      expect(session.context).toEqual({});
    });

    test('should create session with platform information', async () => {
      const session = await sessionService.createSession('user123', 'whatsapp');
      expect(session.platform).toBe('whatsapp');
    });

    test('should generate unique session IDs', async () => {
      const session1 = await sessionService.createSession('user1');
      const session2 = await sessionService.createSession('user2');
      expect(session1.id).not.toBe(session2.id);
    });
  });

  describe('Session Retrieval', () => {
    test('should retrieve existing session by ID', async () => {
      const createdSession = await sessionService.createSession('user123');
      const retrievedSession = await sessionService.getSession(createdSession.id);
      expect(retrievedSession).toEqual(createdSession);
    });

    test('should return null for non-existent session', async () => {
      const session = await sessionService.getSession('non-existent-id');
      expect(session).toBeNull();
    });

    test('should retrieve session by user ID', async () => {
      const session = await sessionService.createSession('user123');
      const userSessions = await sessionService.getSessionsByUserId('user123');
      expect(userSessions).toHaveLength(1);
      expect(userSessions[0].id).toBe(session.id);
    });

    test('should return empty array for user with no sessions', async () => {
      const sessions = await sessionService.getSessionsByUserId('user456');
      expect(sessions).toHaveLength(0);
    });
  });

  describe('Message Management', () => {
    test('should add message to session', async () => {
      const session = await sessionService.createSession('user123');
      const message = {
        role: 'user',
        content: 'Hello',
        timestamp: new Date()
      };
      
      await sessionService.addMessage(session.id, message);
      const updatedSession = await sessionService.getSession(session.id);
      expect(updatedSession.messages).toHaveLength(1);
      expect(updatedSession.messages[0]).toEqual(message);
    });

    test('should handle multiple messages in session', async () => {
      const session = await sessionService.createSession('user123');
      const messages = [
        { role: 'user', content: 'Hello', timestamp: new Date() },
        { role: 'assistant', content: 'Hi there!', timestamp: new Date() },
        { role: 'user', content: 'How are you?', timestamp: new Date() }
      ];
      
      for (const msg of messages) {
        await sessionService.addMessage(session.id, msg);
      }
      const updatedSession = await sessionService.getSession(session.id);
      expect(updatedSession.messages).toHaveLength(3);
    });

    test('should throw error when adding message to non-existent session', async () => {
      const message = { role: 'user', content: 'Hello', timestamp: new Date() };
      await expect(sessionService.addMessage('non-existent-id', message)).rejects.toThrow('Session not found');
    });
  });

  describe('Context Management', () => {
    test('should update session context', async () => {
      const session = await sessionService.createSession('user123');
      const context = { currentIntent: 'exchange_rate', lastCurrency: 'USD' };
      
      await sessionService.updateContext(session.id, context);
      const updatedSession = await sessionService.getSession(session.id);
      expect(updatedSession.context).toEqual(context);
    });

    test('should merge context updates', async () => {
      const session = await sessionService.createSession('user123');
      const context1 = { currentIntent: 'exchange_rate' };
      const context2 = { lastCurrency: 'USD' };
      
      await sessionService.updateContext(session.id, context1);
      await sessionService.updateContext(session.id, context2);
      const updatedSession = await sessionService.getSession(session.id);
      expect(updatedSession.context).toEqual({ currentIntent: 'exchange_rate', lastCurrency: 'USD' });
    });

    test('should throw error when updating context for non-existent session', async () => {
      await expect(sessionService.updateContext('non-existent-id', { test: 'value' })).rejects.toThrow('Session not found');
    });
  });

  describe('Session Cleanup', () => {
    test('should remove specific session', async () => {
      const session = await sessionService.createSession('user123');
      await sessionService.removeSession(session.id);
      
      const retrievedSession = await sessionService.getSession(session.id);
      expect(retrievedSession).toBeNull();
    });

    test('should clear all sessions', async () => {
      await sessionService.createSession('user1');
      await sessionService.createSession('user2');
      await sessionService.createSession('user3');
      
      const allSessions = await sessionService.getAllSessions();
      expect(allSessions).toHaveLength(3);
      await sessionService.clearAllSessions();
      const clearedSessions = await sessionService.getAllSessions();
      expect(clearedSessions).toHaveLength(0);
    });

    test('should remove expired sessions', async () => {
      const session = await sessionService.createSession('user123');
      // Manually set session to expired and persist to Redis
      await sessionService.updateSession(session.id, {
        lastActivity: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() // 25 hours ago
      });
      
      await sessionService.removeExpiredSessions();
      const retrievedSession = await sessionService.getSession(session.id);
      expect(retrievedSession).toBeNull();
    });

    test('should keep active sessions', async () => {
      const session = await sessionService.createSession('user123');
      // Manually set session to recent and persist to Redis
      await sessionService.updateSession(session.id, {
        lastActivity: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
      });
      
      await sessionService.removeExpiredSessions();
      const retrievedSession = await sessionService.getSession(session.id);
      expect(retrievedSession).toBeDefined();
    });
  });

  describe('Session Statistics', () => {
    test('should return total session count', async () => {
      await sessionService.createSession('user1');
      await sessionService.createSession('user2');
      await sessionService.createSession('user3');
      
      const totalSessions = await sessionService.getTotalSessions();
      expect(totalSessions).toBe(3);
    });

    test('should return active sessions count', async () => {
      const session1 = await sessionService.createSession('user1');
      const session2 = await sessionService.createSession('user2');
      
      // Set one session as inactive and persist to Redis
      await sessionService.updateSession(session1.id, {
        lastActivity: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
      });
      
      const activeCount = await sessionService.getActiveSessions();
      expect(activeCount).toBe(1);
    });

    test('should return sessions by platform', async () => {
      await sessionService.createSession('user1', 'whatsapp');
      await sessionService.createSession('user2', 'telegram');
      await sessionService.createSession('user3', 'web');
      
      const whatsappSessions = await sessionService.getSessionsByPlatform('whatsapp');
      const telegramSessions = await sessionService.getSessionsByPlatform('telegram');
      const webSessions = await sessionService.getSessionsByPlatform('web');
      
      expect(whatsappSessions).toHaveLength(1);
      expect(telegramSessions).toHaveLength(1);
      expect(webSessions).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid session ID gracefully', async () => {
      await expect(sessionService.getSession(null)).rejects.toThrow('Invalid session ID');
    });

    test('should handle invalid user ID gracefully', async () => {
      await expect(sessionService.createSession(null)).rejects.toThrow('Invalid user ID');
    });

    test('should handle invalid message format', async () => {
      const session = await sessionService.createSession('user123');
      await expect(sessionService.addMessage(session.id, null)).rejects.toThrow('Invalid message format');
    });

    test('should handle invalid context format', async () => {
      const session = await sessionService.createSession('user123');
      await expect(sessionService.updateContext(session.id, null)).rejects.toThrow('Invalid context format');
    });

    test('should handle non-existent session for context update', async () => {
      await expect(sessionService.updateContext('non-existent-id', { test: 'value' })).rejects.toThrow('Session not found');
    });
  });

  describe('Performance', () => {
    test('should handle large number of sessions efficiently', async () => {
      const startTime = Date.now();
      
      // Create 1000 sessions
      for (let i = 0; i < 1000; i++) {
        await sessionService.createSession(`user${i}`);
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      const totalSessions = await sessionService.getTotalSessions();
      expect(totalSessions).toBe(1000);
    });

    test('should handle large number of messages efficiently', async () => {
      const session = await sessionService.createSession('user123');
      const startTime = Date.now();
      
      // Add 1000 messages
      for (let i = 0; i < 1000; i++) {
        await sessionService.addMessage(session.id, {
          role: 'user',
          content: `Message ${i}`,
          timestamp: new Date()
        });
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      
      const updatedSession = await sessionService.getSession(session.id);
      expect(updatedSession.messages).toHaveLength(1000);
    });
  });
}); 