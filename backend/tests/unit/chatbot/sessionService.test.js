const sessionService = require('../../../src/chat-bot/services/sessionService');

describe('Session Service', () => {
  beforeEach(() => {
    // Clear sessions before each test
    sessionService.clearAllSessions();
  });

  afterEach(() => {
    // Clean up after each test
    sessionService.clearAllSessions();
  });

  describe('Session Creation', () => {
    test('should create a new session with unique ID', () => {
      const session = sessionService.createSession('user123');
      expect(session.id).toBeDefined();
      expect(session.userId).toBe('user123');
      expect(session.createdAt).toBeDefined();
      expect(session.messages).toHaveLength(0);
      expect(session.context).toEqual({});
    });

    test('should create session with platform information', () => {
      const session = sessionService.createSession('user123', 'whatsapp');
      expect(session.platform).toBe('whatsapp');
    });

    test('should generate unique session IDs', () => {
      const session1 = sessionService.createSession('user1');
      const session2 = sessionService.createSession('user2');
      expect(session1.id).not.toBe(session2.id);
    });
  });

  describe('Session Retrieval', () => {
    test('should retrieve existing session by ID', () => {
      const createdSession = sessionService.createSession('user123');
      const retrievedSession = sessionService.getSession(createdSession.id);
      expect(retrievedSession).toEqual(createdSession);
    });

    test('should return null for non-existent session', () => {
      const session = sessionService.getSession('non-existent-id');
      expect(session).toBeNull();
    });

    test('should retrieve session by user ID', () => {
      const session = sessionService.createSession('user123');
      const userSessions = sessionService.getSessionsByUserId('user123');
      expect(userSessions).toHaveLength(1);
      expect(userSessions[0].id).toBe(session.id);
    });

    test('should return empty array for user with no sessions', () => {
      const sessions = sessionService.getSessionsByUserId('user456');
      expect(sessions).toHaveLength(0);
    });
  });

  describe('Message Management', () => {
    test('should add message to session', () => {
      const session = sessionService.createSession('user123');
      const message = {
        role: 'user',
        content: 'Hello',
        timestamp: new Date()
      };
      
      sessionService.addMessage(session.id, message);
      const updatedSession = sessionService.getSession(session.id);
      expect(updatedSession.messages).toHaveLength(1);
      expect(updatedSession.messages[0]).toEqual(message);
    });

    test('should handle multiple messages in session', () => {
      const session = sessionService.createSession('user123');
      const messages = [
        { role: 'user', content: 'Hello', timestamp: new Date() },
        { role: 'assistant', content: 'Hi there!', timestamp: new Date() },
        { role: 'user', content: 'How are you?', timestamp: new Date() }
      ];
      
      messages.forEach(msg => sessionService.addMessage(session.id, msg));
      const updatedSession = sessionService.getSession(session.id);
      expect(updatedSession.messages).toHaveLength(3);
    });

    test('should throw error when adding message to non-existent session', () => {
      const message = { role: 'user', content: 'Hello', timestamp: new Date() };
      expect(() => {
        sessionService.addMessage('non-existent-id', message);
      }).toThrow('Session not found');
    });
  });

  describe('Context Management', () => {
    test('should update session context', () => {
      const session = sessionService.createSession('user123');
      const context = { currentIntent: 'exchange_rate', lastCurrency: 'USD' };
      
      sessionService.updateContext(session.id, context);
      const updatedSession = sessionService.getSession(session.id);
      expect(updatedSession.context).toEqual(context);
    });

    test('should merge context updates', () => {
      const session = sessionService.createSession('user123');
      sessionService.updateContext(session.id, { currentIntent: 'exchange_rate' });
      sessionService.updateContext(session.id, { lastCurrency: 'USD' });
      
      const updatedSession = sessionService.getSession(session.id);
      expect(updatedSession.context).toEqual({
        currentIntent: 'exchange_rate',
        lastCurrency: 'USD'
      });
    });

    test('should throw error when updating context for non-existent session', () => {
      expect(() => {
        sessionService.updateContext('non-existent-id', { test: 'value' });
      }).toThrow('Session not found');
    });
  });

  describe('Session Cleanup', () => {
    test('should remove specific session', () => {
      const session = sessionService.createSession('user123');
      sessionService.removeSession(session.id);
      
      const retrievedSession = sessionService.getSession(session.id);
      expect(retrievedSession).toBeNull();
    });

    test('should clear all sessions', () => {
      sessionService.createSession('user1');
      sessionService.createSession('user2');
      sessionService.createSession('user3');
      
      expect(sessionService.getAllSessions()).toHaveLength(3);
      sessionService.clearAllSessions();
      expect(sessionService.getAllSessions()).toHaveLength(0);
    });

    test('should remove expired sessions', () => {
      const session = sessionService.createSession('user123');
      // Manually set session to expired
      session.lastActivity = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      
      sessionService.removeExpiredSessions();
      const retrievedSession = sessionService.getSession(session.id);
      expect(retrievedSession).toBeNull();
    });

    test('should keep active sessions', () => {
      const session = sessionService.createSession('user123');
      // Manually set session to recent
      session.lastActivity = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
      
      sessionService.removeExpiredSessions();
      const retrievedSession = sessionService.getSession(session.id);
      expect(retrievedSession).toBeDefined();
    });
  });

  describe('Session Statistics', () => {
    test('should return total session count', () => {
      sessionService.createSession('user1');
      sessionService.createSession('user2');
      sessionService.createSession('user3');
      
      expect(sessionService.getTotalSessions()).toBe(3);
    });

    test('should return active sessions count', () => {
      const session1 = sessionService.createSession('user1');
      const session2 = sessionService.createSession('user2');
      
      // Set one session as inactive
      session1.lastActivity = new Date(Date.now() - 25 * 60 * 60 * 1000);
      
      expect(sessionService.getActiveSessions()).toBe(1);
    });

    test('should return sessions by platform', () => {
      sessionService.createSession('user1', 'whatsapp');
      sessionService.createSession('user2', 'telegram');
      sessionService.createSession('user3', 'web');
      
      expect(sessionService.getSessionsByPlatform('whatsapp')).toHaveLength(1);
      expect(sessionService.getSessionsByPlatform('telegram')).toHaveLength(1);
      expect(sessionService.getSessionsByPlatform('web')).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid session ID gracefully', () => {
      expect(() => {
        sessionService.getSession(null);
      }).toThrow('Invalid session ID');
    });

    test('should handle invalid user ID gracefully', () => {
      expect(() => {
        sessionService.createSession(null);
      }).toThrow('Invalid user ID');
    });

    test('should handle invalid message format', () => {
      const session = sessionService.createSession('user123');
      expect(() => {
        sessionService.addMessage(session.id, null);
      }).toThrow('Invalid message format');
    });
  });

  describe('Performance', () => {
    test('should handle large number of sessions efficiently', () => {
      const startTime = Date.now();
      
      // Create 1000 sessions
      for (let i = 0; i < 1000; i++) {
        sessionService.createSession(`user${i}`);
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(sessionService.getTotalSessions()).toBe(1000);
    });

    test('should handle large number of messages efficiently', () => {
      const session = sessionService.createSession('user123');
      const startTime = Date.now();
      
      // Add 1000 messages
      for (let i = 0; i < 1000; i++) {
        sessionService.addMessage(session.id, {
          role: 'user',
          content: `Message ${i}`,
          timestamp: new Date()
        });
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      
      const updatedSession = sessionService.getSession(session.id);
      expect(updatedSession.messages).toHaveLength(1000);
    });
  });
}); 