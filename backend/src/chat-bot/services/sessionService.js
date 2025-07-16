// In-memory session storage (in production, use Redis or database)
const sessions = new Map();

/**
 * Create a new chat session
 * @param {string} userId - User ID (optional for anonymous users)
 * @returns {object} - Session object
 */
async function createSession(userId = null) {
  const sessionId = generateSessionId();
  const session = {
    id: sessionId,
    userId: userId,
    context: {
      conversationHistory: [],
      lastIntent: null,
      lastEntities: [],
      userData: {},
      sessionStartTime: new Date(),
      lastActivity: new Date()
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  sessions.set(sessionId, session);
  
  // Auto-cleanup after 30 minutes of inactivity
  setTimeout(() => {
    if (sessions.has(sessionId)) {
      const currentSession = sessions.get(sessionId);
      const inactiveTime = new Date() - currentSession.context.lastActivity;
      if (inactiveTime > 30 * 60 * 1000) { // 30 minutes
        sessions.delete(sessionId);
      }
    }
  }, 30 * 60 * 1000);
  
  return session;
}

/**
 * Get session by ID
 * @param {string} sessionId 
 * @returns {object|null} - Session object or null if not found
 */
async function getSessionById(sessionId) {
  const session = sessions.get(sessionId);
  
  if (session) {
    // Update last activity
    session.context.lastActivity = new Date();
    sessions.set(sessionId, session);
  }
  
  return session || null;
}

/**
 * Update session context
 * @param {string} sessionId 
 * @param {object} context 
 * @returns {boolean} - Success status
 */
async function updateSession(sessionId, context) {
  const session = sessions.get(sessionId);
  
  if (!session) {
    return false;
  }
  
  session.context = {
    ...session.context,
    ...context,
    lastActivity: new Date()
  };
  session.updatedAt = new Date();
  
  sessions.set(sessionId, session);
  return true;
}

/**
 * Delete session
 * @param {string} sessionId 
 * @returns {boolean} - Success status
 */
async function deleteSession(sessionId) {
  return sessions.delete(sessionId);
}

/**
 * Get sessions by user ID
 * @param {string} userId 
 * @returns {array} - Array of sessions
 */
async function getSessionsByUserId(userId) {
  const userSessions = [];
  
  for (const [sessionId, session] of sessions.entries()) {
    if (session.userId === userId) {
      userSessions.push(session);
    }
  }
  
  return userSessions;
}

/**
 * Clean up expired sessions
 */
function cleanupExpiredSessions() {
  const now = new Date();
  const maxInactiveTime = 30 * 60 * 1000; // 30 minutes
  
  for (const [sessionId, session] of sessions.entries()) {
    const inactiveTime = now - session.context.lastActivity;
    if (inactiveTime > maxInactiveTime) {
      sessions.delete(sessionId);
    }
  }
}

/**
 * Generate unique session ID
 * @returns {string} - Unique session ID
 */
function generateSessionId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `chat_${timestamp}_${random}`;
}

/**
 * Get session statistics
 * @returns {object} - Session stats
 */
function getSessionStats() {
  const totalSessions = sessions.size;
  const activeSessions = Array.from(sessions.values()).filter(session => {
    const inactiveTime = new Date() - session.context.lastActivity;
    return inactiveTime < 5 * 60 * 1000; // Active in last 5 minutes
  }).length;
  
  return {
    totalSessions,
    activeSessions,
    inactiveSessions: totalSessions - activeSessions
  };
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);

module.exports = {
  createSession,
  getSessionById,
  updateSession,
  deleteSession,
  getSessionsByUserId,
  cleanupExpiredSessions,
  getSessionStats
};