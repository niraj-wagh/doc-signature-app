const mongoose = require('mongoose');

const SignatureSchema = new mongoose.Schema(
  {
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
    signerName: { type: String, required: true },
    signerEmail: { type: String, default: null },
    // Coordinates stored as relative percentages (0-1) for responsive re-rendering
    xPercent: { type: Number, required: true },
    yPercent: { type: Number, required: true, default: 0.86 },
    page: { type: Number, required: true, default: 1 },
    widthPercent: { type: Number, default: 0.26 },
    heightPercent: { type: Number, default: 0.07 },
    signatureText: { type: String, default: null }, // typed signature text
    signatureImage: { type: String, default: null }, // base64 image data of drawn signature
    status: {
      type: String,
      enum: ['Pending', 'Signed', 'Rejected'],
      default: 'Pending',
    },
    signedAt: { type: Date, default: null },
  },
  { timestamps: true }
);


module.exports = mongoose.model('Signature', SignatureSchema);
