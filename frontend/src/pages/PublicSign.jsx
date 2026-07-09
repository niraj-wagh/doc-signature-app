import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DndContext } from '@dnd-kit/core';
import api from '../api/axios';
import PDFViewer from '../components/PDFViewer';
import SignatureField from '../components/SignatureField';
import SignaturePad from '../components/SignaturePad';

export default function PublicSign() {
  const { token } = useParams();
  const [document_, setDocument] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeSignature, setActiveSignature] = useState(null);
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [message, setMessage] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/docs/public/${token}`);
        setDocument(data.document);
        const sigRes = await api.get(`/signatures/${data.document._id}`);
        setSignatures(sigRes.data.signatures);
      } catch (err) {
        setError(err.response?.data?.message || 'This signing link is invalid or expired');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleSign = (sig) => {
    if (!signerName.trim()) {
      setError('Please enter your name before signing');
      return;
    }
    setError('');
    setActiveSignature(sig);
  };

  const handleSaveSignature = async ({ signatureText, signatureImage }) => {
    try {
      const { data } = await api.put(`/signatures/${activeSignature._id}/sign`, {
        signatureText,
        signatureImage,
        signerName,
        signerEmail,
        shareToken: token,
      });
      setSignatures((prev) => prev.map((s) => (s._id === data.signature._id ? data.signature : s)));
      setDocument(data.document);
      setActiveSignature(null);
      setMessage('Your signature has been recorded. Thank you!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save signature');
    }
  };

  const handleReject = async () => {
    try {
      const targetSig = signatures.find((s) => s.status !== 'Signed');
      if (!targetSig) return;
      const { data } = await api.put(`/signatures/${targetSig._id}/sign`, {
        action: 'reject',
        reason: rejectReason,
        signerEmail,
        shareToken: token,
      });
      setDocument(data.document);
      setShowRejectModal(false);
      setMessage('Document has been rejected.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject document');
    }
  };

  const pageSignatures = signatures.filter((s) => s.page === pageNumber);
  // filePath is now a full Cloudinary URL
  const fileUrl = document_ ? document_.filePath : null;
  const allSigned = signatures.length > 0 && signatures.every((s) => s.status === 'Signed');

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>;

  if (error && !document_) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="card max-w-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Link Unavailable</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-1">Document Signing</h1>
      <p className="text-gray-500 text-sm mb-4">{document_.originalName}</p>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-3">{error}</div>}
      {message && <div className="bg-green-50 text-green-700 text-sm rounded-lg px-3 py-2 mb-3">{message}</div>}

      {document_.status === 'Rejected' ? (
        <div className="card text-center"><p className="text-red-600 font-medium">This document has been rejected.</p></div>
      ) : allSigned ? (
        <div className="card text-center"><p className="text-green-600 font-medium">This document has been fully signed. Thank you!</p></div>
      ) : (
        <>
          <div className="card mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Your Name</label>
              <input type="text" value={signerName} onChange={(e) => setSignerName(e.target.value)} className="input-field" placeholder="Full name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Your Email (optional)</label>
              <input type="email" value={signerEmail} onChange={(e) => setSignerEmail(e.target.value)} className="input-field" placeholder="you@example.com" />
            </div>
          </div>

          {numPages > 1 && (
            <div className="flex items-center gap-2 mb-3">
              <button disabled={pageNumber <= 1} onClick={() => setPageNumber((p) => p - 1)} className="btn-secondary text-sm disabled:opacity-50">Prev</button>
              <span className="text-sm">Page {pageNumber} of {numPages}</span>
              <button disabled={pageNumber >= numPages} onClick={() => setPageNumber((p) => p + 1)} className="btn-secondary text-sm disabled:opacity-50">Next</button>
            </div>
          )}

          <DndContext>
            <PDFViewer fileUrl={fileUrl} pageNumber={pageNumber} setNumPages={setNumPages}>
              {pageSignatures.length > 0 && (
                <div
                  className="absolute left-0 right-0 border-t-2 border-dashed border-seal/40 pointer-events-none flex items-start"
                  style={{ top: `${pageSignatures[0].yPercent * 100}%` }}
                >
                  <span className="text-[10px] uppercase tracking-wide text-seal/60 bg-parchment/90 px-1.5 -mt-2 ml-1 rounded">
                    Signing line
                  </span>
                </div>
              )}
              {pageSignatures.map((sig) => (
                <SignatureField
                  key={sig._id}
                  id={sig._id}
                  xPercent={sig.xPercent}
                  yPercent={sig.yPercent}
                  widthPercent={sig.widthPercent}
                  heightPercent={sig.heightPercent}
                  label={sig.status === 'Signed' ? '✓ Signed' : 'Tap to sign'}
                  status={sig.status}
                />
              ))}
            </PDFViewer>
          </DndContext>

          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {pageSignatures.filter((s) => s.status !== 'Signed').map((sig) => (
              <button key={sig._id} onClick={() => handleSign(sig)} className="btn-primary">
                Sign at bottom of page {sig.page}
              </button>
            ))}
            <button onClick={() => setShowRejectModal(true)} className="btn-secondary text-red-600">
              Reject Document
            </button>
          </div>
        </>
      )}

      {activeSignature && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <SignaturePad onSave={handleSaveSignature} onCancel={() => setActiveSignature(null)} />
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <h3 className="font-semibold mb-2">Reject Document</h3>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="input-field" rows={3} placeholder="Reason for rejection (optional)" />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowRejectModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleReject} className="btn-primary bg-red-600 hover:bg-red-700">Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
