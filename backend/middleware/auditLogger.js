const AuditLog = require('../models/AuditLog');

// Helper to record an audit entry. Can be called directly from controllers/routes.
async function logAction({ documentId, action, actor, req, details = {} }) {
  try {
    const ipAddress =
      req?.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req?.socket?.remoteAddress ||
      req?.ip ||
      null;

    const userAgent = req?.headers['user-agent'] || null;

    await AuditLog.create({
      documentId,
      action,
      actor: actor || 'anonymous',
      ipAddress,
      userAgent,
      details,
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

module.exports = { logAction };
