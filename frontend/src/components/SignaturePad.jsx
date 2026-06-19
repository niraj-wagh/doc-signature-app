import React, { useRef, useState, useEffect } from 'react';

export default function SignaturePad({ onSave, onCancel }) {
  const canvasRef = useRef(null);
  const [mode, setMode] = useState('draw'); // 'draw' or 'type'
  const [typedText, setTypedText] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
  }, [mode]);

  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDraw = (e) => {
    setIsDrawing(true);
    setHasDrawing(true);
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
  };

  const handleSave = () => {
    if (mode === 'draw') {
      if (!hasDrawing) return;
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSave({ signatureImage: dataUrl });
    } else {
      if (!typedText.trim()) return;
      onSave({ signatureText: typedText.trim() });
    }
  };

  return (
    <div className="card w-full max-w-md">
      <h3 className="font-semibold mb-3">Add Your Signature</h3>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setMode('draw')}
          className={`px-3 py-1.5 rounded-lg text-sm ${mode === 'draw' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}
        >
          Draw
        </button>
        <button
          onClick={() => setMode('type')}
          className={`px-3 py-1.5 rounded-lg text-sm ${mode === 'type' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}
        >
          Type
        </button>
      </div>

      {mode === 'draw' ? (
        <>
          <canvas
            ref={canvasRef}
            width={400}
            height={150}
            className="border border-gray-300 rounded-lg w-full touch-none bg-white"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
          <button onClick={clearCanvas} className="text-xs text-gray-500 mt-1">
            Clear
          </button>
        </>
      ) : (
        <input
          type="text"
          value={typedText}
          onChange={(e) => setTypedText(e.target.value)}
          placeholder="Type your full name"
          className="input-field font-serif italic text-lg"
        />
      )}

      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button onClick={handleSave} className="btn-primary">
          Apply Signature
        </button>
      </div>
    </div>
  );
}
