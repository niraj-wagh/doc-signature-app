const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
    action: { type: String, required: true }, // e.g., 'uploaded', 'viewed', 'signed', 'rejected', 'finalized', 'link_generated'
    actor: { type: String, default: 'unknown' }, // email or 'anonymous'
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', AuditLogSchema);
