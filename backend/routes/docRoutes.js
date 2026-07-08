const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Document = require('../models/Document');
const Signature = require('../models/Signature');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { logAction } = require('../middleware/auditLogger');

const router = express.Router();

// POST /api/docs/upload  - Upload a PDF
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded or invalid file type' });
    }

  const document = await Document.create({
  owner: req.user.id,
  originalName: req.file.originalname,
  filePath: req.file.path, // Cloudinary returns full URL in req.file.path
  status: 'Pending',
});

    await logAction({
      documentId: document._id,
      action: 'uploaded',
      actor: req.user.email,
      req,
      details: { originalName: req.file.originalname },
    });

    res.status(201).json({ message: 'File uploaded successfully', document });
  } catch (err) {
    res.status(500).json({ message: 'Server error during upload', error: err.message });
  }
});

// GET /api/docs - List current user's documents (with optional status filter)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { owner: req.user.id };
    if (status && ['Pending', 'Signed', 'Rejected'].includes(status)) {
      filter.status = status;
    }

    const documents = await Document.find(filter).sort({ createdAt: -1 });
    res.json({ documents });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/docs/:id - View a specific document's metadata
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await logAction({
      documentId: document._id,
      action: 'viewed',
      actor: req.user.email,
      req,
    });

    res.json({ document });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/docs/:id - Delete a document (owner only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove physical files
    const uploadPath = path.join(__dirname, '..', 'uploads', document.filePath);
    if (fs.existsSync(uploadPath)) fs.unlinkSync(uploadPath);

    if (document.signedFilePath) {
      const signedPath = path.join(__dirname, '..', 'signed', document.signedFilePath);
      if (fs.existsSync(signedPath)) fs.unlinkSync(signedPath);
    }

    await Signature.deleteMany({ documentId: document._id });
    await document.deleteOne();

    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/docs/:id/share - Generate a tokenized public signing link
router.post('/:id/share', authMiddleware, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const token = crypto.randomBytes(24).toString('hex');
    const expiresInDays = req.body.expiresInDays || 7;

    document.shareToken = token;
    document.shareTokenExpires = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    await document.save();

    await logAction({
      documentId: document._id,
      action: 'link_generated',
      actor: req.user.email,
      req,
      details: { expiresInDays },
    });

    const shareUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/sign/${token}`;

    res.json({ message: 'Share link generated', shareUrl, token, expiresAt: document.shareTokenExpires });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/docs/public/:token - Public access to a document via share token (no auth)
router.get('/public/:token', async (req, res) => {
  try {
    const document = await Document.findOne({ shareToken: req.params.token });
    if (!document) return res.status(404).json({ message: 'Invalid or expired link' });

    if (document.shareTokenExpires && document.shareTokenExpires < new Date()) {
      return res.status(410).json({ message: 'This signing link has expired' });
    }

    await logAction({
      documentId: document._id,
      action: 'viewed_public',
      actor: 'anonymous',
      req,
    });

    res.json({
      document: {
        _id: document._id,
        originalName: document.originalName,
        filePath: document.filePath,
        status: document.status,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
