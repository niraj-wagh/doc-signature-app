import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function UploadDocument() {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validateAndSetFile = (selected) => {
    if (!selected) return;
    if (selected.type !== 'application/pdf') {
      setError('Only PDF files are supported');
      return;
    }
    if (selected.size > 15 * 1024 * 1024) {
      setError('File size must be under 15MB');
      return;
    }
    setError('');
    setFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    validateAndSetFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await api.post('/docs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate(`/documents/${data.document._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upload a Document</h1>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`card border-2 border-dashed text-center py-12 cursor-pointer transition-colors ${
          dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
        }`}
        onClick={() => document.getElementById('fileInput').click()}
      >
        <input
          id="fileInput"
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => validateAndSetFile(e.target.files[0])}
        />
        {file ? (
          <p className="font-medium text-gray-700">{file.name}</p>
        ) : (
          <>
            <p className="text-gray-500 mb-1">Drag & drop your PDF here</p>
            <p className="text-sm text-gray-400">or click to browse (max 15MB)</p>
          </>
        )}
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="btn-primary w-full mt-4 disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Upload Document'}
      </button>
    </div>
  );
}
