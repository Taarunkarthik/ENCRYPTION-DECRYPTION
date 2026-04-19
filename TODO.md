# 🔐 File Encryption & Decryption Web App - TODO

## Phase 1: Project Setup & Infrastructure ✅ COMPLETED

- [x] Create Maven `pom.xml` with dependencies
- [x] Initialize Spring Boot single-module project structure
- [x] Create Spring Boot main application class
- [x] Configure `application.yml` for Supabase and encryption
- [x] Set up Bouncy Castle crypto provider configuration
- [x] Implement Spring Security with JWT filter
- [x] Create DTOs (EncryptionRequest, EncryptionResponse, AuditLogDTO)
- [x] Create exception classes and global exception handler
- [x] Initialize React + Vite project with Tailwind CSS
- [x] Set up Supabase client (TypeScript)
- [x] Create API client with JWT interceptor
- [x] Implement useAuth hook
- [x] Create project Dockerfiles (backend & frontend)
- [x] Create docker-compose.yml
- [x] Create environment configuration (.env.example)
- [x] Create Supabase SQL initialization script

---

## Phase 2: Encryption Core & is  ✅ COMPLETED

### AES-256-GCM Encryption Service
- [x] Implement `AesEncryptionService.java`
  - [x] Encryption method with PBKDF2-SHA256 key derivation (100k iterations)
  - [x] Decryption method with IV extraction
  - [x] Random IV generation per encryption
  - [x] GCM tag validation
  - [x] Unit tests for encrypt/decrypt consistency
- [x] Implement `EncryptedOutput` model (IV + ciphertext + GCM tag)

### Spring Boot Services & Controllers
- [x] Implement `FileService.java`
  - [x] Upload encrypted file to Supabase Storage
  - [x] Download and decrypt file from Supabase Storage
  - [x] Streaming support for large files
  - [x] File ownership validation
- [x] Implement `FileController.java`
  - [x] `POST /api/encrypt` endpoint (multipart file + passphrase)
  - [x] `GET /api/decrypt/{fileId}` endpoint (with passphrase in request)
  - [x] `GET /api/audit-logs` endpoint
  - [x] Input validation and error handling
- [x] Implement `AuditService.java`
  - [x] Async logging to Supabase
  - [x] Log encryption operations
  - [x] Log decryption operations

### Supabase Integration
- [x] Initialize Supabase client in Spring Boot
- [x] Implement JWT token validation using Supabase public keys
- [x] Implement Supabase Storage integration (upload/download)
- [x] Implement Supabase insert for audit logs

### Configuration & Security
- [ ] Test multipart file upload with large files (5GB+)
- [ ] Configure Spring Security CORS policy
- [ ] Add security headers (HSTS, CSP, X-Frame-Options)
- [ ] Implement rate limiting on encrypt/decrypt endpoints
- [ ] Test JWT refresh token handling

---

## Phase 3: React Frontend (UI & Integration) ✅ COMPLETED

### React Components & Pages
- [x] Create App.tsx with routing
- [x] Create LoginPage.tsx (Supabase email/password auth)
- [x] Create DashboardPage.tsx (main menu)
- [x] Create EncryptPage.tsx (file upload + encryption form)
- [x] Create DecryptPage.tsx (file upload + decryption form)
- [x] Implement AuditLogViewer component (table of audit logs)
- [x] Add progress indicators for file operations
- [x] Add file validation (MIME type, size)
- [x] Add passphrase strength indicator

### Frontend Features
- [x] Implement file drag-and-drop on upload forms
- [x] Add password visibility toggle
- [x] Add confirm dialog before encryption/decryption
- [x] Add session expiry warning
- [x] Add responsive design for mobile

### Frontend Testing
- [ ] Test login flow with Supabase
- [ ] Test file upload and encryption
- [ ] Test file download and decryption
- [ ] Test audit log viewing
- [ ] Test logout and session management

---

## Phase 5: Integration & End-to-End Testing

- [ ] Test full encryption workflow (upload → encrypt → verify in Storage)
- [ ] Test full decryption workflow (download → decrypt → compare original)
- [ ] Test with various file sizes (1KB, 100MB, 1GB, 5GB)
- [ ] Test wrong passphrase scenario
- [ ] Test corrupted encrypted file handling
- [ ] Test audit log accuracy and RLS policy
- [ ] Test JWT expiry and refresh token flow
- [ ] Test unauthorized access attempts
- [ ] Test CORS policy enforcement
- [ ] Test rate limiting

---

## Phase 6: Deployment & Documentation

### Docker & Deployment
- [ ] Build backend Docker image
- [ ] Build frontend Docker image
- [ ] Push to container registry
- [ ] Test docker-compose locally
- [ ] Create Kubernetes manifests (optional)

### Documentation
- [ ] Complete README.md with setup instructions
- [ ] Add security best practices guide
- [ ] Add API documentation (endpoint specs)
- [ ] Add troubleshooting guide
- [ ] Create roadmap for future features

### Security Hardening
- [ ] Review and harden CORS configuration
- [ ] Enable HTTPS in production
- [ ] Configure database backups
- [ ] Set up log monitoring
- [ ] Implement request signing/verification
- [ ] Add CSRF protection if needed

### Phase 2: Text Encryption ✅ COMPLETED
- [x] Text encryption/decryption endpoints
- [x] Frontend UI for text encryption/decryption (Menu items 3 & 4)

### Phase 4: Signatures, Integrity & Auditing (Menu Items 5-8) ✅ COMPLETED

#### File Signing & Verification (Items 5 & 6)
- [x] Implement `SignatureService.java` (RSA/ECDSA key pair generation, file signing, and verification)
- [x] Create `SignatureController.java` with `/api/signature/sign`, `/api/signature/verify`, and `/api/signature/generate-keypair` endpoints
- [x] Create frontend `SignFilePage.tsx` UI with file upload and key management
- [x] Create frontend `VerifySignaturePage.tsx` UI to upload file and signature for verification

#### File Integrity Check (Item 7)
- [x] Implement `IntegrityService.java` for calculating cryptographic file hashes (SHA-256, SHA-512, SHA-1, MD5)
- [x] Create endpoint `/api/integrity/hash` to return file hashes
- [x] Create frontend `CheckIntegrityPage.tsx` UI to compute and compare hashes

#### Audit Log Viewer (Item 8)
- [x] Update frontend routing in `App.tsx` for `/audit-log`
- [x] Create frontend `AuditLogPage.tsx` with a data table/grid to display records, filter, and sort
- [x] Connect frontend to existing `GET /api/audit-logs` backend endpoint

### Future Enhancements (Phase 7+)
- [ ] Support additional algorithms (Twofish, Blowfish, RSA, ECC)
- [ ] Batch file encryption
- [ ] Scheduled encryption tasks
- [ ] File versioning and history
- [ ] Two-factor authentication
- [ ] API key management for programmatic access
- [ ] Mobile app (React Native or Flutter)

---

## Implementation Checklist

### Backend Compilation
```bash
cd backend
mvn clean package
```

### Frontend Build
```bash
cd frontend
npm install
npm run build
```

### Local Development (Docker)
```bash
docker-compose up
```

### Running Tests
```bash
# Backend unit tests
cd backend && mvn test

# Frontend tests (when implemented)
cd frontend && npm test
```

---

## Key Metrics & Goals

- **Security:** AES-256-GCM encryption with PBKDF2-SHA256 key derivation
- **Performance:** Support 500MB-5GB files with streaming (no memory exhaustion)
- **Reliability:** 100% audit logging of all operations
- **Usability:** < 3 clicks to encrypt/decrypt a file
- **Deployment:** Docker containerization with production-ready configs
- **Testing:** ≥80% code coverage on crypto and service layers

---

## Known Limitations & Workarounds

1. **File ID Generation:** Currently files are stored in Supabase; need ID generation strategy for decryption reference
2. **Session Management:** Supabase JWT tokens have 1-hour expiry; need refresh token handling
3. **Browser Download:** Large files (>2GB) may have browser limitations; verify browser caps
4. **Memory Usage:** Monitor JVM heap size for large file encryption operations
5. **Rate Limiting:** Implement per-IP or per-user rate limiting to prevent abuse

---

## Security Considerations

✓ **In Place:**
- AES-256-GCM encryption (authenticated encryption)
- PBKDF2-SHA256 key derivation (100k iterations)
- Random IV per encryption operation
- JWT authentication via Supabase
- Row-Level Security (RLS) on audit logs
- HTTPS-only communication (production)

⚠️ **To Implement:**
- Rate limiting on encrypt/decrypt endpoints
- CORS policy enforcement
- Content Security Policy (CSP) headers
- HSTS headers for HTTPS
- Input validation and sanitization
- File upload size limits
- Passphrase complexity requirements
- Secure session timeout

---

## Contact & Support

For issues or questions, refer to the README.md or create an issue in the repository.
