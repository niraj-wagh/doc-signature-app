import React, { useState } from 'react';
import { Document as PDFDocument, Page as PDFPage, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PDFViewer({ fileUrl, onPageRender, children, pageNumber, setPageNumber, setNumPages }) {
  const [width] = useState(700);

  const options = {
    httpHeaders: {
      'Access-Control-Allow-Origin': '*',
    },
    withCredentials: false,
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      <PDFDocument
        file={{ url: fileUrl, ...options }}
        onLoadSuccess={(pdf) => setNumPages(pdf.numPages)}
        loading={<p className="text-gray-500 py-12">Loading PDF...</p>}
        error={<p className="text-red-500 py-12">Failed to load PDF — check file permissions</p>}
        options={options}
      >
        <div className="relative inline-block border border-gray-200 shadow-sm">
          <PDFPage
            pageNumber={pageNumber}
            width={width}
            onRenderSuccess={(page) => onPageRender && onPageRender(page)}
          />
          {children}
        </div>
      </PDFDocument>
    </div>
  );
}
