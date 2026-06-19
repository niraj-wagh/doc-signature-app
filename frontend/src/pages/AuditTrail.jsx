import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

const actionLabels = {
  uploaded: 'Document Uploaded',
  viewed: 'Document Viewed',
  viewed_public: 'Viewed via Public Link',
  signature_field_placed: 'Signature Field Placed',
  signed: 'Signature Submitted',
  rejected: 'Document Rejected',
  finalized: 'Final Signed PDF Generated',
  link_generated: 'Share Link Generated',
};

export default function AuditTrail() {
  const { id } = useParams();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/audit/${id}`)
      .then(({ data }) => setLogs(data.logs))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load audit trail'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Audit Trail</h1>
        <Link to={`/documents/${id}`} className="btn-secondary text-sm">
          Back to Document
        </Link>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : logs.length === 0 ? (
        <div className="card text-center text-gray-500">No audit events recorded yet.</div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log._id} className="card flex items-start justify-between">
              <div>
                <p className="font-medium">{actionLabels[log.action] || log.action}</p>
                <p className="text-sm text-gray-500">By: {log.actor}</p>
                {log.details && Object.keys(log.details).length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">{JSON.stringify(log.details)}</p>
                )}
              </div>
              <div className="text-right text-xs text-gray-400">
                <p>{new Date(log.createdAt).toLocaleString()}</p>
                {log.ipAddress && <p>IP: {log.ipAddress}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
