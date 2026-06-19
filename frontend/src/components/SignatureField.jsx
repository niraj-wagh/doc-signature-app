import React from 'react';
import { useDraggable } from '@dnd-kit/core';

// A signature slot fixed to the document's bottom signing line.
// Only the horizontal position is draggable — position is stored as
// percentages (0-1) relative to the page container, with yPercent held
// constant by the parent (the signing line anchor).
export default function SignatureField({ id, xPercent, yPercent, widthPercent, heightPercent, label, status, onRemove }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });

  const style = {
    position: 'absolute',
    left: `${xPercent * 100}%`,
    top: `${yPercent * 100}%`,
    width: `${widthPercent * 100}%`,
    height: `${heightPercent * 100}%`,
    // translateY is intentionally omitted — fields cannot leave the signing line
    transform: transform ? `translate3d(${transform.x}px, 0, 0)` : undefined,
    touchAction: 'none',
  };

  const statusStyles = {
    Pending: 'border-gold/60 bg-parchment/80 text-graphite/70',
    Signed: 'border-seal bg-parchment text-seal-dark',
    Rejected: 'border-red-400 bg-red-50/80 text-red-600',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex flex-col items-center justify-center border-b-2 border-dashed rounded-sm cursor-grab active:cursor-grabbing font-signature text-base ${
        statusStyles[status] || statusStyles.Pending
      }`}
    >
      <span className="truncate px-1 leading-none">{label || 'Sign here'}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(id);
          }}
          className="absolute -top-2 -right-2 bg-seal text-parchment rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-sans"
        >
          ×
        </button>
      )}
    </div>
  );
}