const express = require('express');
const path = require('path');
const fs = require('fs');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const Document = require('../models/Document');
const Signature = require('../models/Signature');
const authMiddleware = require('../middleware/authMiddleware');
const { logAction } = require('../middleware/auditLogger');

const router = express.Router();

// POST /api/signatures - Save a signature position (authenticated owner placing fields)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { documentId, xPercent, yPercent, page, widthPercent, heightPercent, signerName, signerEmail } = req.body;

    if (!documentId || xPercent === undefined || yPercent === undefined || !page) {
      return res.status(400).json({ message: 'documentId, xPercent, yPercent, and page are required' });
    }

    const document = await Document.findById(documentId);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const signature = await Signature.create({
      documentId,
      signerName: signerName || req.user.name,
      signerEmail: signerEmail || null,
      xPercent,
      yPercent,
      page,
      widthPercent: widthPercent || 0.2,
      heightPercent: heightPercent || 0.08,
      status: 'Pending',
    });

    await logAction({
      documentId,
      action: 'signature_field_placed',
      actor: req.user.email,
      req,
      details: { signatureId: signature._id, page, xPercent, yPercent },
    });

    res.status(201).json({ message: 'Signature field saved', signature });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/signatures/:documentId - Get all signature fields for a document
router.get('/:documentId', async (req, res) => {
  try {
    const signatures = await Signature.find({ documentId: req.params.documentId }).sort({ createdAt: 1 });
    res.json({ signatures });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/signatures/:id/sign - Signer submits their signature (text or image), works for public token flow too
router.put('/:id/sign', async (req, res) => {
  try {
    const { signatureText, signatureImage, signerName, signerEmail, action, reason, shareToken } = req.body;

    const signature = await Signature.findById(req.params.id);
    if (!signature) return res.status(404).json({ message: 'Signature field not found' });

    const document = await Document.findById(signature.documentId);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    // If accessed via public share token, validate it
    if (shareToken) {
      if (document.shareToken !== shareToken) {
        return res.status(403).json({ message: 'Invalid share token' });
      }
      if (document.shareTokenExpires && document.shareTokenExpires < new Date()) {
        return res.status(410).json({ message: 'This signing link has expired' });
      }
    }

    if (action === 'reject') {
      signature.status = 'Rejected';
      document.status = 'Rejected';
      document.rejectionReason = reason || 'No reason provided';
      await signature.save();
      await document.save();

      await logAction({
        documentId: document._id,
        action: 'rejected',
        actor: signerEmail || signature.signerEmail || 'anonymous',
        req,
        details: { reason: document.rejectionReason },
      });

      return res.json({ message: 'Signature rejected', signature, document });
    }

    if (!signatureText && !signatureImage) {
      return res.status(400).json({ message: 'signatureText or signatureImage is required' });
    }

    signature.signatureText = signatureText || null;
    signature.signatureImage = signatureImage || null;
    signature.signerName = signerName || signature.signerName;
    signature.signerEmail = signerEmail || signature.signerEmail;
    signature.status = 'Signed';
    signature.signedAt = new Date();
    await signature.save();

    await logAction({
      documentId: document._id,
      action: 'signed',
      actor: signerEmail || signature.signerEmail || 'anonymous',
      req,
      details: { signatureId: signature._id },
    });

    // Check if all signatures for this document are signed -> update doc status
    const allSignatures = await Signature.find({ documentId: document._id });
    const allSigned = allSignatures.every((s) => s.status === 'Signed');
    if (allSigned) {
      document.status = 'Signed';
      await document.save();
    }

    res.json({ message: 'Signature recorded', signature, document });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/signatures/finalize - Embed signatures into the PDF and generate the final signed file
router.post('/finalize', authMiddleware, async (req, res) => {
  try {
    const { documentId } = req.body;
    if (!documentId) return res.status(400).json({ message: 'documentId is required' });

    const document = await Document.findById(documentId);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const signatures = await Signature.find({ documentId, status: 'Signed' });
    if (signatures.length === 0) {
      return res.status(400).json({ message: 'No signed signature fields found for this document' });
    }

    const sourcePath = path.join(__dirname, '..', 'uploads', document.filePath);
    if (!fs.existsSync(sourcePath)) {
      return res.status(404).json({ message: 'Source PDF file not found on server' });
    }

    const existingPdfBytes = fs.readFileSync(sourcePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const pages = pdfDoc.getPages();

    for (const sig of signatures) {
      const pageIndex = Math.max(0, (sig.page || 1) - 1);
      const pdfPage = pages[pageIndex] || pages[0];
      const { width, height } = pdfPage.getSize();

      const x = sig.xPercent * width;
      // PDF coordinate origin is bottom-left; UI coordinates are typically top-left
      const y = height - sig.yPercent * height - sig.heightPercent * height;
      const boxWidth = sig.widthPercent * width;
      const boxHeight = sig.heightPercent * height;

      if (sig.signatureImage) {
        try {
          const base64Data = sig.signatureImage.replace(/^data:image\/\w+;base64,/, '');
          const imageBytes = Buffer.from(base64Data, 'base64');

          let embeddedImage;
          if (sig.signatureImage.includes('image/png')) {
            embeddedImage = await pdfDoc.embedPng(imageBytes);
          } else {
            embeddedImage = await pdfDoc.embedJpg(imageBytes);
          }

          pdfPage.drawImage(embeddedImage, {
            x,
            y,
            width: boxWidth,
            height: boxHeight,
          });
        } catch (imgErr) {
          console.error('Error embedding signature image:', imgErr.message);
        }
      } else if (sig.signatureText) {
        pdfPage.drawText(sig.signatureText, {
          x,
          y: y + boxHeight / 4,
          size: Math.min(18, boxHeight * 0.6),
          font: helveticaFont,
          color: rgb(0.1, 0.1, 0.6),
        });
      }

      // Draw a timestamp caption under the signature
      pdfPage.drawText(
        `Signed by ${sig.signerName} on ${sig.signedAt ? sig.signedAt.toISOString() : new Date().toISOString()}`,
        {
          x,
          y: Math.max(y - 10, 5),
          size: 6,
          font: helveticaFont,
          color: rgb(0.4, 0.4, 0.4),
        }
      );
    }

    const signedPdfBytes = await pdfDoc.save();
    const signedFileName = `signed-${document._id}-${Date.now()}.pdf`;
    const signedFilePath = path.join(__dirname, '..', 'signed', signedFileName);
    fs.writeFileSync(signedFilePath, signedPdfBytes);

    document.signedFilePath = signedFileName;
    document.status = 'Signed';
    await document.save();

    await logAction({
      documentId: document._id,
      action: 'finalized',
      actor: req.user.email,
      req,
      details: { signedFileName, signatureCount: signatures.length },
    });

    res.json({
      message: 'Signed PDF generated successfully',
      signedFilePath: signedFileName,
      downloadUrl: `/signed/${signedFileName}`,
      document,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during PDF finalization', error: err.message });
  }
});

module.exports = router;
