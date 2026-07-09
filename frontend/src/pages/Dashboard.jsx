import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const STATUS_FILTERS = ['All', 'Pending', 'Signed', 'Rejected'];

const badgeClass = {
  Pending: 'badge badge-pending',
  Signed: 'badge badge-signed',
  Rejected: 'badge badge-rejected',
};

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareModal, setShareModal] = useState(null);

  const fetchDocs = async (status) => {
    setLoading(true);
    setError('');
    try {
      const params = status && status !== 'All' ? { status } : {};
      const { data } = await api.get('/docs', { params });
      setDocuments(data.documents);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs(filter);
  }, [filter]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document permanently?')) return;
    try {
      await api.delete(`/docs/${id}`);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete document');
    }
  };

  const handleShare = async (id) => {
    try {
      const { data } = await api.post(`/docs/${id}/share`, { expiresInDays: 7 });
      setShareModal(data.shareUrl);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate share link');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Documents</h1>
        <Link to="/upload" className="btn-primary">+ Upload Document</Link>
      </div>

      <div className="flex gap-2 mb-4">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === s ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      {loading ? (
        <p className="text-gray-500">Loading documents...</p>
      ) : documents.length === 0 ? (
        <div className="card text-center text-gray-500">
          No documents found. <Link to="/upload" className="text-primary-600">Upload one</Link> to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div key={doc._id} className="card flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold truncate" title={doc.originalName}>{doc.originalName}</h3>
                <span className={badgeClass[doc.status]}>{doc.status}</span>
              </div>
              <p className="text-xs text-gray-400">Uploaded {new Date(doc.createdAt).toLocaleDateString()}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Link to={`/documents/${doc._id}`} className="btn-secondary text-xs">Open</Link>
                <Link to={`/documents/${doc._id}/audit`} className="btn-secondary text-xs">Audit Trail</Link>
                <button onClick={() => handleShare(doc._id)} className="btn-secondary text-xs">Share Link</button>
                {doc.signedFilePath && (
                  // signedFilePath is now a full Cloudinary URL
                  <a href={doc.signedFilePath} target="_blank" rel="noreferrer" className="btn-secondary text-xs">
                    Download Signed
                  </a>
                )}
                <button onClick={() => handleDelete(doc._id)} className="text-xs text-red-500 hover:text-red-700 ml-auto">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {shareModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="card w-full max-w-md">
            <h3 className="font-semibold mb-2">Signing Link Generated</h3>
            <p className="text-sm text-gray-600 mb-2">Share this link with the signer (valid for 7 days):</p>
            <div className="bg-gray-100 rounded-lg p-2 text-xs break-all mb-4">{shareModal}</div>
            <div className="flex justify-end gap-2">
              <button onClick={() => navigator.clipboard.writeText(shareModal)} className="btn-secondary">Copy</button>
              <button onClick={() => setShareModal(null)} className="btn-primary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
