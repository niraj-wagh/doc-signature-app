import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { DndContext } from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import api from '../api/axios';
import PDFViewer from '../components/PDFViewer';
import SignatureField from '../components/SignatureField';
import SignaturePad from '../components/SignaturePad';

export default function DocumentEditor() {
  const { id } = useParams();
  const [document_, setDocument] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [pageSize, setPageSize] = useState({ width: 700, height: 900 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeSignature, setActiveSignature] = useState(null); // signature being signed
  const [finalizing, setFinalizing] = useState(false);
  const [message, setMessage] = useState('');
  

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [docRes, sigRes] = await Promise.all([
        api.get(`/docs/${id}`),
        api.get(`/signatures/${id}`),
      ]);
      setDocument(docRes.data.document);
      setSignatures(sigRes.data.signatures);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

 const fileUrl = document_ ? document_.filePath : null;

  // Signature fields are always pinned to the bottom signing strip of the page.
  // Only horizontal slot (left / center / right) is configurable, matching how
  // real paper documents reserve a signature line at the foot of the page.
  const BOTTOM_Y_PERCENT = 0.86; // fixed vertical anchor near the bottom margin
  const FIELD_WIDTH = 0.26;
  const FIELD_HEIGHT = 0.07;

  const nextBottomSlot = () => {
    const occupied = signatures.filter((s) => s.page === pageNumber).length;
    const slots = [0.06, 0.37, 0.68]; // left, center, right slots in the bottom strip
    return slots[occupied % slots.length];
  };

  const handleAddField = async () => {
    try {
      const { data } = await api.post('/signatures', {
        documentId: id,
        xPercent: nextBottomSlot(),
        yPercent: BOTTOM_Y_PERCENT,
        page: pageNumber,
        widthPercent: FIELD_WIDTH,
        heightPercent: FIELD_HEIGHT,
      });
      setSignatures((prev) => [...prev, data.signature]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add signature field');
    }
  };

  // Dragging is constrained to the horizontal axis only — fields slide along
  // the bottom signing strip but can never leave it vertically.
  const handleDragEnd = (event) => {
    const { active, delta } = event;
    if (!delta.x) return;

    setSignatures((prev) =>
      prev.map((sig) => {
        if (sig._id !== active.id) return sig;

        const newXPercent = Math.min(Math.max(sig.xPercent + delta.x / pageSize.width, 0), 1 - sig.widthPercent);

        api
          .post('/signatures', {
            documentId: id,
            xPercent: newXPercent,
            yPercent: BOTTOM_Y_PERCENT,
            page: sig.page,
            widthPercent: sig.widthPercent,
            heightPercent: sig.heightPercent,
            signerName: sig.signerName,
          })
          .catch(() => {});

        return { ...sig, xPercent: newXPercent, yPercent: BOTTOM_Y_PERCENT };
      })
    );
  };

  const handleSign = (sig) => setActiveSignature(sig);

  const handleSaveSignature = async ({ signatureText, signatureImage }) => {
    try {
      const { data } = await api.put(`/signatures/${activeSignature._id}/sign`, {
        signatureText,
        signatureImage,
        signerName: activeSignature.signerName,
      });
      setSignatures((prev) => prev.map((s) => (s._id === data.signature._id ? data.signature : s)));
      setDocument(data.document);
      setActiveSignature(null);
      setMessage('Signature applied');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save signature');
    }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    setError('');
    try {
      const { data } = await api.post('/signatures/finalize', { documentId: id });
      setDocument(data.document);
      setMessage('Signed PDF generated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to finalize document');
    } finally {
      setFinalizing(false);
    }
  };

  const onPageRender = (page) => {
    const viewport = page.getViewport({ scale: 1 });
    const containerWidth = 700;
    const scale = containerWidth / viewport.width;
    setPageSize({ width: viewport.width * scale, height: viewport.height * scale });
  };

  const pageSignatures = signatures.filter((s) => s.page === pageNumber);

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!document_) return <p className="text-red-500">{error || 'Document not found'}</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold truncate">{document_.originalName}</h1>
          <span className={`badge badge-${document_.status.toLowerCase()}`}>{document_.status}</span>
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-3">{error}</div>}
        {message && <div className="bg-green-50 text-green-700 text-sm rounded-lg px-3 py-2 mb-3">{message}</div>}

        {numPages > 1 && (
          <div className="flex items-center gap-2 mb-3">
            <button
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((p) => p - 1)}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-sm">
              Page {pageNumber} of {numPages}
            </span>
            <button
              disabled={pageNumber >= numPages}
              onClick={() => setPageNumber((p) => p + 1)}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        <DndContext onDragEnd={handleDragEnd} modifiers={[restrictToHorizontalAxis]}>
          <PDFViewer
            fileUrl={fileUrl}
            pageNumber={pageNumber}
            setNumPages={setNumPages}
            onPageRender={onPageRender}
          >
            {/* Bottom signing strip — every signature field is anchored to this line */}
            <div
              className="absolute left-0 right-0 border-t-2 border-dashed border-seal/40 pointer-events-none flex items-start"
              style={{ top: `${BOTTOM_Y_PERCENT * 100}%` }}
            >
              <span className="text-[10px] uppercase tracking-wide text-seal/60 bg-parchment/90 px-1.5 -mt-2 ml-1 rounded">
                Signing line
              </span>
            </div>

            {pageSignatures.map((sig) => (
              <SignatureField
                key={sig._id}
                id={sig._id}
                xPercent={sig.xPercent}
                yPercent={sig.yPercent}
                widthPercent={sig.widthPercent}
                heightPercent={sig.heightPercent}
                label={sig.status === 'Signed' ? `✓ ${sig.signerName}` : sig.signerName}
                status={sig.status}
              />
            ))}
          </PDFViewer>
        </DndContext>
      </div>

      <aside className="space-y-4">
        <div className="card">
          <h3 className="font-semibold mb-2">Signature Fields</h3>
          <button onClick={handleAddField} className="btn-secondary w-full text-sm mb-3">
            + Add Signature Line (page {pageNumber})
          </button>
          <p className="text-xs text-gray-400 mb-3 -mt-1">
            Fields snap to the signing line at the bottom of the page — drag left or right to reposition.
          </p>

          {signatures.length === 0 ? (
            <p className="text-xs text-gray-400">No signature fields placed yet.</p>
          ) : (
            <ul className="space-y-2">
              {signatures.map((sig) => (
                <li key={sig._id} className="flex items-center justify-between text-sm border-b pb-2">
                  <div>
                    <p className="font-medium">{sig.signerName}</p>
                    <p className="text-xs text-gray-400">
                      Page {sig.page} · {sig.status}
                    </p>
                  </div>
                  {sig.status !== 'Signed' && (
                    <button onClick={() => handleSign(sig)} className="btn-primary text-xs">
                      Sign
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold mb-2">Finalize</h3>
          <p className="text-xs text-gray-500 mb-3">
            Embed all signed fields into a final, immutable PDF.
          </p>
          <button onClick={handleFinalize} disabled={finalizing} className="btn-primary w-full text-sm">
            {finalizing ? 'Generating...' : 'Generate Signed PDF'}
          </button>

          {document_.signedFilePath && (
            <a
              href={`/signed/${document_.signedFilePath}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary w-full text-sm text-center block mt-2"
            >
              Download Signed PDF
            </a>
          )}
        </div>
      </aside>

      {activeSignature && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <SignaturePad onSave={handleSaveSignature} onCancel={() => setActiveSignature(null)} />
        </div>
      )}
    </div>
  );
}
