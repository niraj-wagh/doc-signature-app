const express = require('express');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/audit/:fileId - Get audit trail for a document (owner only)
router.get('/:fileId', authMiddleware, async (req, res) => {
  try {
    const document = await Document.findById(req.params.fileId);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const logs = await AuditLog.find({ documentId: req.params.fileId }).sort({ createdAt: -1 });
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
