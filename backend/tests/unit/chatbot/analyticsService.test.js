const analyticsService = require('../../../src/chat-bot/services/analyticsService');

// Mock Redis
jest.mock('ioredis', () => {
  const mockRedis = {
    setex: jest.fn(),
    hincrby: jest.fn(),
    hgetall: jest.fn(),
    lpush: jest.fn(),
    ltrim: jest.fn(),
    lrange: jest.fn(),
    keys: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    smembers: jest.fn(),
    sadd: jest.fn(),
    srem: jest.fn(),
    expire: jest.fn(),
    quit: jest.fn(),
    on: jest.fn()
  };
  return jest.fn(() => mockRedis);
});

describe('Analytics Service', () => {
  let mockRedis;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    mockRedis = require('ioredis')();
  });

  describe('Event Tracking', () => {
    test('should track event successfully', async () => {
      const event = {
        userId: 'user123',
        sessionId: 'session456',
        platform: 'web',
        eventType: 'message_received',
        intent: 'greeting',
        confidence: 0.95,
        entities: ['currency'],
        responseTime: 150,
        message: 'Hello',
        response: 'Hi there!'
      };

      await analyticsService.trackEvent(event);

      expect(mockRedis.setex).toHaveBeenCalled();
      expect(mockRedis.hincrby).toHaveBeenCalled();
    });

    test('should handle tracking errors gracefully', async () => {
      mockRedis.setex.mockRejectedValue(new Error('Redis error'));

      const event = {
        userId: 'user123',
        sessionId: 'session456',
        platform: 'web',
        eventType: 'message_received'
      };

      // Should not throw error
      await expect(analyticsService.trackEvent(event)).resolves.toBeUndefined();
    });

    test('should track error events', async () => {
      const event = {
        userId: 'user123',
        sessionId: 'session456',
        platform: 'web',
        eventType: 'error',
        message: 'Hello',
        error: 'NLP service unavailable'
      };

      await analyticsService.trackEvent(event);

      expect(mockRedis.setex).toHaveBeenCalled();
      expect(mockRedis.hincrby).toHaveBeenCalledWith(
        expect.any(String),
        'errors',
        1
      );
    });
  });

  describe('Metrics Update', () => {
    test('should update hourly and daily metrics', async () => {
      const eventData = {
        eventType: 'message_received',
        platform: 'web',
        intent: 'greeting',
        confidence: 0.95,
        responseTime: 150,
        error: null
      };

      await analyticsService.updateMetrics(eventData);

      // Should update hourly metrics
      expect(mockRedis.hincrby).toHaveBeenCalledWith(
        expect.stringContaining('hourly:'),
        'total_events',
        1
      );

      // Should update daily metrics
      expect(mockRedis.hincrby).toHaveBeenCalledWith(
        expect.stringContaining('daily:'),
        'total_events',
        1
      );
    });

    test('should track intent metrics', async () => {
      const eventData = {
        eventType: 'message_received',
        platform: 'web',
        intent: 'exchange_rate',
        confidence: 0.95,
        responseTime: 150
      };

      await analyticsService.updateMetrics(eventData);

      expect(mockRedis.hincrby).toHaveBeenCalledWith(
        expect.any(String),
        'intent_exchange_rate',
        1
      );
    });

    test('should track platform metrics', async () => {
      const eventData = {
        eventType: 'message_received',
        platform: 'whatsapp',
        intent: 'greeting',
        confidence: 0.95,
        responseTime: 150
      };

      await analyticsService.updateMetrics(eventData);

      expect(mockRedis.hincrby).toHaveBeenCalledWith(
        expect.any(String),
        'platform_whatsapp',
        1
      );
    });

    test('should track response times', async () => {
      const eventData = {
        eventType: 'message_received',
        platform: 'web',
        intent: 'greeting',
        confidence: 0.95,
        responseTime: 150
      };

      await analyticsService.updateMetrics(eventData);

      expect(mockRedis.lpush).toHaveBeenCalledWith(
        expect.stringContaining('response_times'),
        150
      );
    });

    test('should track confidence scores', async () => {
      const eventData = {
        eventType: 'message_received',
        platform: 'web',
        intent: 'greeting',
        confidence: 0.95,
        responseTime: 150
      };

      await analyticsService.updateMetrics(eventData);

      expect(mockRedis.lpush).toHaveBeenCalledWith(
        expect.stringContaining('confidence_scores'),
        0.95
      );
    });
  });

  describe('Analytics Retrieval', () => {
    test('should get daily analytics', async () => {
      const mockMetrics = {
        'total_events': '100',
        'event_message_received': '80',
        'event_error': '5',
        'platform_web': '60',
        'platform_whatsapp': '40',
        'intent_greeting': '30',
        'intent_exchange_rate': '25',
        'errors': '5'
      };

      mockRedis.hgetall.mockResolvedValue(mockMetrics);
      mockRedis.lrange.mockResolvedValue(['150', '200', '180']);

      const analytics = await analyticsService.getAnalytics('day');

      expect(analytics.period).toBe('day');
      expect(analytics.metrics.events.message_received).toBe(80);
      expect(analytics.metrics.platforms.web).toBe(60);
      expect(analytics.metrics.intents.greeting).toBe(30);
      expect(analytics.performance.avgResponseTime).toBeGreaterThan(0);
    });

    test('should get weekly analytics', async () => {
      const mockDailyMetrics = {
        'total_events': '50',
        'event_message_received': '40',
        'platform_web': '30'
      };

      mockRedis.hgetall.mockResolvedValue(mockDailyMetrics);
      mockRedis.lrange.mockResolvedValue(['150', '200']);

      const analytics = await analyticsService.getAnalytics('week');

      expect(analytics.period).toBe('week');
    });

    test('should get monthly analytics', async () => {
      const mockDailyMetrics = {
        'total_events': '100',
        'event_message_received': '80',
        'platform_web': '60'
      };

      mockRedis.hgetall.mockResolvedValue(mockDailyMetrics);
      mockRedis.lrange.mockResolvedValue(['150', '200']);

      const analytics = await analyticsService.getAnalytics('month');

      expect(analytics.period).toBe('month');
    });

    test('should handle empty metrics gracefully', async () => {
      mockRedis.hgetall.mockResolvedValue({});
      mockRedis.lrange.mockResolvedValue([]);

      const analytics = await analyticsService.getAnalytics('day');

      expect(analytics.metrics.events).toEqual({});
      expect(analytics.metrics.platforms).toEqual({});
      expect(analytics.metrics.intents).toEqual({});
      expect(analytics.performance.avgResponseTime).toBe(0);
    });
  });

  describe('Intent Performance', () => {
    test('should get intent performance data', async () => {
      const mockMetrics = {
        'total_events': '100',
        'intent_greeting': '30',
        'intent_exchange_rate': '25',
        'intent_send_money': '20'
      };

      mockRedis.hgetall.mockResolvedValue(mockMetrics);

      const performance = await analyticsService.getIntentPerformance('day');

      expect(performance).toHaveLength(3);
      expect(performance[0].intent).toBe('greeting');
      expect(performance[0].count).toBe(30);
      expect(performance[0].percentage).toBe(30);
    });

    test('should sort intents by count', async () => {
      const mockMetrics = {
        'total_events': '100',
        'intent_greeting': '20',
        'intent_exchange_rate': '30',
        'intent_send_money': '25'
      };

      mockRedis.hgetall.mockResolvedValue(mockMetrics);

      const performance = await analyticsService.getIntentPerformance('day');

      expect(performance[0].intent).toBe('exchange_rate');
      expect(performance[0].count).toBe(30);
    });
  });

  describe('Platform Usage', () => {
    test('should get platform usage data', async () => {
      const mockMetrics = {
        'total_events': '100',
        'platform_web': '60',
        'platform_whatsapp': '30',
        'platform_telegram': '10'
      };

      mockRedis.hgetall.mockResolvedValue(mockMetrics);

      const usage = await analyticsService.getPlatformUsage('day');

      expect(usage).toHaveLength(3);
      expect(usage[0].platform).toBe('web');
      expect(usage[0].count).toBe(60);
      expect(usage[0].percentage).toBe(60);
    });

    test('should sort platforms by usage', async () => {
      const mockMetrics = {
        'total_events': '100',
        'platform_web': '30',
        'platform_whatsapp': '50',
        'platform_telegram': '20'
      };

      mockRedis.hgetall.mockResolvedValue(mockMetrics);

      const usage = await analyticsService.getPlatformUsage('day');

      expect(usage[0].platform).toBe('whatsapp');
      expect(usage[0].count).toBe(50);
    });
  });

  describe('User Journey', () => {
    test('should get user journey data', async () => {
      const mockEventData = JSON.stringify({
        timestamp: '2024-01-01T10:00:00Z',
        userId: 'user123',
        sessionId: 'session456',
        platform: 'web',
        eventType: 'message_received',
        intent: 'greeting',
        confidence: 0.95,
        message: 'Hello',
        response: 'Hi there!'
      });

      mockRedis.keys.mockResolvedValue(['event_1', 'event_2']);
      mockRedis.get.mockResolvedValue(mockEventData);

      const journey = await analyticsService.getUserJourney('user123');

      expect(journey.userId).toBe('user123');
      expect(journey.totalEvents).toBe(2);
      expect(journey.intentFlow).toContain('greeting');
      expect(journey.platformUsage.web).toBe(2);
    });

    test('should get session-specific journey', async () => {
      const mockEventData = JSON.stringify({
        timestamp: '2024-01-01T10:00:00Z',
        userId: 'user123',
        sessionId: 'session456',
        platform: 'web',
        eventType: 'message_received',
        intent: 'greeting'
      });

      mockRedis.keys.mockResolvedValue(['event_1']);
      mockRedis.get.mockResolvedValue(mockEventData);

      const journey = await analyticsService.getUserJourney('user123', 'session456');

      expect(journey.sessionId).toBe('session456');
      expect(journey.totalEvents).toBe(1);
    });

    test('should handle empty user journey', async () => {
      mockRedis.keys.mockResolvedValue([]);

      const journey = await analyticsService.getUserJourney('user123');

      expect(journey.totalEvents).toBe(0);
      expect(journey.events).toHaveLength(0);
    });
  });

  describe('Data Export', () => {
    test('should export JSON analytics', async () => {
      const mockMetrics = {
        'total_events': '100',
        'event_message_received': '80',
        'platform_web': '60'
      };

      mockRedis.hgetall.mockResolvedValue(mockMetrics);
      mockRedis.lrange.mockResolvedValue(['150', '200']);

      const data = await analyticsService.exportAnalytics('day', 'json');

      expect(typeof data).toBe('string');
      const parsed = JSON.parse(data);
      expect(parsed.period).toBe('day');
    });

    test('should export CSV analytics', async () => {
      const mockMetrics = {
        'total_events': '100',
        'event_message_received': '80',
        'platform_web': '60'
      };

      mockRedis.hgetall.mockResolvedValue(mockMetrics);
      mockRedis.lrange.mockResolvedValue(['150', '200']);

      const data = await analyticsService.exportAnalytics('day', 'csv');

      expect(typeof data).toBe('string');
      expect(data).toContain('Metric,Value');
      expect(data).toContain('Total Events,100');
    });

    test('should handle export errors', async () => {
      mockRedis.hgetall.mockRejectedValue(new Error('Redis error'));

      await expect(analyticsService.exportAnalytics('day')).rejects.toThrow('Failed to export analytics');
    });
  });

  describe('Error Handling', () => {
    test('should handle Redis connection errors', async () => {
      mockRedis.setex.mockRejectedValue(new Error('Connection failed'));

      const event = {
        userId: 'user123',
        sessionId: 'session456',
        platform: 'web',
        eventType: 'message_received'
      };

      // Should not throw error
      await expect(analyticsService.trackEvent(event)).resolves.toBeUndefined();
    });

    test('should handle invalid analytics period', async () => {
      await expect(analyticsService.getAnalytics('invalid')).rejects.toThrow('Failed to retrieve analytics');
    });

    test('should handle Redis get errors', async () => {
      mockRedis.hgetall.mockRejectedValue(new Error('Redis error'));

      await expect(analyticsService.getAnalytics('day')).rejects.toThrow('Failed to retrieve analytics');
    });
  });

  describe('Performance', () => {
    test('should handle large number of events efficiently', async () => {
      const event = {
        userId: 'user123',
        sessionId: 'session456',
        platform: 'web',
        eventType: 'message_received',
        intent: 'greeting',
        confidence: 0.95,
        responseTime: 150
      };

      const startTime = Date.now();
      
      // Track 100 events
      const promises = Array(100).fill().map(() => analyticsService.trackEvent(event));
      await Promise.all(promises);
      
      const endTime = Date.now();
      
      // Should complete within 5 seconds
      expect(endTime - startTime).toBeLessThan(5000);
      expect(mockRedis.setex).toHaveBeenCalledTimes(100);
    });
  });
}); 