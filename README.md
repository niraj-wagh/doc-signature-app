# Document Signature App

A secure, full-stack MERN application for uploading documents, placing digital signatures, sharing tokenized signing links, and generating legally traceable signed PDFs — similar to DocuSign/Adobe Sign.

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, react-pdf, dnd-kit, Axios, React Hook Form + Zod, React Router
- **Backend:** Node.js + Express, MongoDB (Mongoose), JWT (access + refresh), bcryptjs, Multer, pdf-lib, nodemailer
- **Storage:** Local disk (dev) — swap for AWS S3 / Supabase in production
- **Deployment targets:** Frontend → Vercel/Netlify, Backend → Render/Railway, DB → MongoDB Atlas

## Project Structure

```
doc-signature-app/
├── backend/
│   ├── models/         # User, Document, Signature, AuditLog
│   ├── routes/         # auth, docs, signatures, audit
│   ├── middleware/      # auth, upload (multer), audit logger
│   ├── uploads/          # uploaded source PDFs
│   ├── signed/           # generated signed PDFs
│   ├── server.js
│   └── .env.example
└── frontend/
    └── src/
        ├── api/          # axios client with JWT refresh
        ├── context/       # AuthContext
        ├── components/    # Navbar, PDFViewer, SignatureField, SignaturePad
        └── pages/          # Login, Register, Dashboard, Upload, DocumentEditor, AuditTrail, PublicSign
```

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env   # edit MONGO_URI, JWT secrets, etc.
npm install
npm run dev             # or: npm start
```

Runs on `http://localhost:5000`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` (proxies `/api`, `/uploads`, `/signed` to the backend).

## Core Features

- **JWT auth** (access + refresh tokens) with bcrypt password hashing
- **PDF upload** via Multer (15MB limit, PDF-only)
- **Drag-and-drop signature placement** with dnd-kit, stored as relative (x%, y%) coordinates per page
- **Signature capture**: drawn (canvas) or typed
- **Server-side PDF finalization** using pdf-lib — embeds signatures/images and timestamps into an immutable signed PDF
- **Tokenized public signing links** with expiry — no login required for external signers
- **Status lifecycle**: Pending → Signed / Rejected, with rejection reasons
- **Audit trail**: every action (upload, view, field placement, sign, reject, finalize, share) logged with actor, IP, user agent, and timestamp
- **Dashboard** with status filtering, share-link generation, and signed PDF download

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |
| POST | `/api/docs/upload` | Upload PDF |
| GET | `/api/docs` | List documents (filter by `?status=`) |
| GET | `/api/docs/:id` | Get document |
| DELETE | `/api/docs/:id` | Delete document |
| POST | `/api/docs/:id/share` | Generate tokenized share link |
| GET | `/api/docs/public/:token` | Public document access |
| POST | `/api/signatures` | Place a signature field |
| GET | `/api/signatures/:documentId` | List signature fields |
| PUT | `/api/signatures/:id/sign` | Sign or reject a field |
| POST | `/api/signatures/finalize` | Generate final signed PDF |
| GET | `/api/audit/:fileId` | Get audit trail |

## Notes

- Coordinates are stored as percentages so signature placements render correctly across different screen sizes.
- For production, move file storage to S3/Supabase, configure real SMTP for nodemailer, and set strong JWT secrets.
