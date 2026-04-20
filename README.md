# 🔐 File Encryption & Decryption Web App

A full-stack, production-ready file encryption and decryption web application built with **React + Vite**, **Spring Boot 3.x**, **Supabase Auth & Storage**, and **AES-256-GCM encryption**.

## ✨ Features (MVP)

- 🔐 **AES-256-GCM Encryption** with PBKDF2-SHA256 key derivation
- 📁 **Large File Support** - Stream files up to 5GB without memory exhaustion
- 🔑 **Supabase Authentication** - Secure email/password login
- 📊 **Audit Logging** - Track all encryption/decryption operations
- ✍️ **Digital Signatures** - RSA-SHA256 signing (Detached & Embedded modes)
- 🛡️ **Admin Console** - Centralized management for system-wide audit logs
- 👥 **User Management** - Role-based access control (Admin vs User)
- 👤 **Guest Mode** - Access core tools without an account
- 📥 **Auto-Download** - Immediate encrypted file download after processing
- 🎨 **Modern UI** - React with Tailwind CSS
- 🐳 **Docker Support** - Containerized deployment

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | React 18 + Vite + Tailwind CSS |
| **Backend** | Spring Boot 3.x (Java 17) |
| **Authentication** | Supabase Auth |
| **Storage** | Supabase Storage (encrypted bucket) |
| **Encryption** | Bouncy Castle (AES-256-GCM) |
| **Build** | Maven 3.9 |
| **Containerization** | Docker + docker-compose |

## 📚 Documentation

- [API Documentation](API_DOCUMENTATION.md)
- [Security Best Practices](SECURITY_BEST_PRACTICES.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)
- [Project Roadmap](ROADMAP.md)

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose (for containerized setup)
- OR Java 17+ & Node 20+ (for local development)
- Supabase account (free tier available at https://supabase.com)

### Option 1: Docker Setup (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd ENCRYPTION-DECRYPTION

# Copy environment template
cp .env.example .env

# Edit .env with your Supabase credentials
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# SUPABASE_JWT_SECRET=your-jwt-secret

# Build and start
docker-compose up --build
```

Access:
- Frontend: http://localhost
- Backend API: http://localhost:8080/api
- Health check: http://localhost:8080/api/health

### Option 2: Local Development

**Backend:**
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📋 API Endpoints

### Authentication
All endpoints (except `/api/health`) require JWT token in header: `Authorization: Bearer <token>`

### File Operations

#### Encrypt File
```bash
POST /api/encrypt
Content-Type: multipart/form-data

Parameters:
  file: <binary file>
  passphrase: <string (min 8 chars)>

Response:
{
  "fileId": "encrypted_<uuid>.bin",
  "fileName": "original_file.pdf",
  "fileSizeBytes": 1024000,
  "message": "File encrypted successfully",
  "timestamp": 1698000000000
}
```

#### Decrypt File
```bash
POST /api/decrypt/{fileId}
Content-Type: application/json

Body:
{
  "passphrase": "<string>"
}

Response: <binary decrypted file>
```

#### View Audit Logs
```bash
GET /api/audit-logs

Response:
[
  {
    "id": "<uuid>",
    "user_id": "<uuid>",
    "action": "ENCRYPT",
    "file_name": "document.pdf",
    "file_size_bytes": 1024000,
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

### Digital Signatures

#### Generate Key Pair
```bash
GET /api/signature/generate-keypair

Response:
{
  "privateKey": "<base64>",
  "publicKey": "<base64>",
  "algorithm": "RSA-2048",
  "message": "Key pair generated successfully"
}
```

#### Sign File
```bash
POST /api/signature/sign
Content-Type: multipart/form-data

Parameters:
  file: <binary file>
  privateKey: <base64 string>

Response:
{
  "signature": "<base64 detached signature>",
  "signedFile": "<base64 embedded signed file>",
  "fileName": "document.pdf",
  "message": "File signed successfully with embedded signature"
}
```

#### Verify Signature
```bash
POST /api/signature/verify
Content-Type: multipart/form-data

Parameters:
  file: <binary file (original or signed)>
  signature: <base64 (optional if using signed file)>
  publicKey: <base64 string>

Response:
{
  "valid": true,
  "verificationMode": "Embedded",
  "message": "✅ Embedded signature is VALID"
}
```

#### Health Check
```bash
GET /api/health

Response:
{
  "status": "UP",
  "service": "File Encryption Service"
}
```

## 🔒 Security Features

### Encryption
- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: PBKDF2-SHA256 with 100,000 iterations
- **IV Generation**: Random 16-byte IV per encryption
- **Authentication Tag**: 128-bit GCM authentication tag

### Storage
- Encrypted files stored in private Supabase Storage bucket
- Row-Level Security (RLS) policies prevent unauthorized access
- File ownership enforced per-user

### Authentication
- Supabase JWT tokens validated server-side
- Spring Security integration
- Stateless session management

### Audit Trail
- All operations logged to Supabase
- User ID, action, file name, file size, timestamp recorded
- RLS policies restrict access to own logs

## 🏗️ Project Structure

```
ENCRYPTION-DECRYPTION/
├── backend/
│   ├── src/main/java/com/encryption/
│   │   ├── config/              # Security & Crypto config
│   │   ├── controller/          # REST endpoints
│   │   ├── service/             # Business logic
│   │   ├── crypto/              # AES encryption
│   │   ├── security/            # JWT filter
│   │   ├── audit/               # Audit logging
│   │   ├── dto/                 # Request/Response models
│   │   └── exception/           # Error handling
│   ├── pom.xml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/               # Login, Dashboard, Encrypt, Decrypt
│   │   ├── components/          # Reusable UI components
│   │   ├── services/            # Supabase & API clients
│   │   ├── hooks/               # Custom React hooks (useAuth)
│   │   └── styles/              # Tailwind CSS
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── sql/
│   └── init.sql                 # Supabase table setup
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🔧 Configuration

### Environment Variables

Create `.env` from `.env.example`:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Server
SERVER_PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Frontend
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Setup

1. Create Supabase project at https://supabase.com
2. Run SQL script to create tables:
   ```sql
   -- Execute sql/init.sql in Supabase SQL editor
   ```
3. Get credentials from Supabase dashboard:
   - API URL (Settings → API)
   - Anon Key (Settings → API)
   - Service Role Key (Settings → API)
   - JWT Secret (Settings → API)

4. **Elevated Access (Admin Panel)**:
   To enable administrative features, execute the additional setup script:
   ```sql
   -- Execute sql/admin_setup.sql in Supabase SQL editor
   ```
   This enables system-wide log viewing and user management.

## 🧪 Testing

### Backend Unit Tests
```bash
cd backend
mvn test
```

Tests cover:
- AES encryption/decryption consistency
- Passphrase validation
- IV randomization
- Large file handling (10MB+ files)
- Wrong passphrase scenarios

### Manual Integration Tests

1. **Login Flow**
   - Navigate to http://localhost/login
   - Create account or sign in with Supabase
   - Verify redirect to dashboard

2. **Encryption**
   - Click "Encrypt File"
   - Select a file
   - Enter passphrase (min 8 chars)
   - Click "Encrypt File"
   - Verify success message

3. **Decryption**
   - Click "Decrypt File"
   - Select previously encrypted file
   - Enter same passphrase
   - Click "Decrypt File"
   - Verify downloaded file matches original

4. **Audit Log**
   - After encrypt/decrypt, check audit logs
   - Verify entries show correct user, action, file name

## 📊 Performance Considerations

### File Size Support
- **Tested**: 1KB to 5GB files
- **Streaming**: Files processed in 8KB chunks (no memory exhaustion)
- **Limits**: Configurable via Spring Boot `spring.servlet.multipart.max-file-size`

### Encryption Performance
- AES-256-GCM: ~100-200 MB/s (depends on CPU)
- IV Generation: < 1ms per file
- Key Derivation (PBKDF2): ~50-100ms per file

## 🚨 Troubleshooting

### "Invalid or expired JWT token"
- Check Supabase credentials in `.env`
- Verify JWT secret matches Supabase settings
- Check token expiry (default 1 hour)

### "Decryption failed: Invalid passphrase or corrupted file"
- Verify correct passphrase entered
- Ensure file wasn't corrupted during download
- Check GCM tag validation in logs

### "File upload failed"
- Check file size (max 5GB)
- Verify Supabase Storage bucket permissions
- Check network connectivity

### Docker image build fails
- Ensure Docker & Maven are installed
- Check Java version (17+)
- Verify network access to Maven Central

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📧 Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the development team.

## 🗺️ Roadmap

### Phase 2 (Completed ✅)
- [x] Text encryption/decryption endpoints
- [x] File signing and signature verification (Detached & Embedded)
- [x] File integrity check endpoint
- [x] Audit log viewer
- [x] Automatic encrypted file download

### Phase 3 (Future)
- [ ] Additional algorithms (RSA, ECC, Twofish, Blowfish)
- [ ] Batch file encryption
- [ ] Two-factor authentication
- [ ] API key management
- [ ] Mobile app (React Native)
- [ ] Scheduled encryption tasks
- [ ] File versioning and history

---

**Version**: 1.0.0  
**Last Updated**: April 2026  
**Status**: Production Ready (MVP)
