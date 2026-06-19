const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    originalName: { type: String, required: true },
    filePath: { type: String, required: true }, // relative path under /uploads
    signedFilePath: { type: String, default: null }, // relative path under /signed
    status: {
      type: String,
      enum: ['Pending', 'Signed', 'Rejected'],
      default: 'Pending',
    },
    shareToken: { type: String, default: null, index: true },
    shareTokenExpires: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', DocumentSchema);
