# 📖 API Documentation

The File Encryption & Decryption Web App provides a RESTful API for file and text security operations.

## Base URL
`http://localhost:8080/api`

## Authentication
All endpoints (except `/api/health`) require a valid Supabase JWT in the `Authorization` header.
Format: `Authorization: Bearer <JWT>`

Note: `POST /api/support` accepts both authenticated users and guests.

---

## 📁 File Operations

### 1. Health Check
`GET /api/health`
- **Description**: Returns the status of the service.
- **Auth**: Not required.
- **Response**: `200 OK`
  ```json
  {"status": "UP", "service": "File Encryption Service"}
  ```

### 2. Encrypt & Upload File
`POST /api/encrypt`
- **Description**: Encrypts a file using AES-256-GCM and uploads it to Supabase storage.
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `file`: The file to encrypt (Binary)
  - `passphrase`: Minimum 8 characters (String)
- **Response**: `200 OK`
  ```json
  {
    "fileId": "encrypted_uuid.bin",
    "fileName": "example.txt",
    "fileSizeBytes": 1234,
    "message": "File encrypted successfully",
    "timestamp": 1698000000000
  }
  ```

### 3. Decrypt & Download File
`POST /api/decrypt/{fileId}`
- **Description**: Decrypts a file previously uploaded and downloads it.
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "passphrase": "your-passphrase"
  }
  ```
- **Response**: `200 OK` (Streamed Binary File)

### 4. Get Audit Logs
`GET /api/audit-logs`
- **Description**: Retrieves encryption/decryption history for the authenticated user.
- **Response**: `200 OK`
  ```json
  [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "action": "ENCRYPT",
      "fileName": "example.txt",
      "fileSizeBytes": 1234,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
  ```

---

## 🔤 Text Operations

### 1. Encrypt Text
`POST /api/text/encrypt`
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "text": "Secret message",
    "passphrase": "your-passphrase"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "encryptedTextBase64": "...",
    "message": "Text encrypted successfully"
  }
  ```

### 2. Decrypt Text
`POST /api/text/decrypt`
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "encryptedTextBase64": "...",
    "passphrase": "your-passphrase"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "decryptedText": "Secret message",
    "message": "Text decrypted successfully"
  }
  ```

---

## ✒️ Signature Operations

### 1. Generate Keypair
`POST /api/signature/generate-keypair`
- **Description**: Generates a new RSA-4096 key pair.
- **Response**: `200 OK`
  ```json
  {
    "publicKey": "...",
    "privateKey": "..."
  }
  ```

### 2. Sign File
`POST /api/signature/sign`
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `file`: File to sign
  - `privateKey`: The RSA private key
- **Response**: `200 OK`
  ```json
  {
    "signature": "Base64EncodedSignature"
  }
  ```

### 3. Verify Signature
`POST /api/signature/verify`
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `file`: The original file
  - `signature`: The Base64 encoded signature
  - `publicKey`: The RSA public key
- **Response**: `200 OK`
  ```json
  {
    "valid": true,
    "message": "Signature verified"
  }
  ```

---

## 🔍 Integrity Operations

### 1. Calculate File Hash
`POST /api/integrity/hash`
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `file`: File to hash
  - `algorithm`: `SHA-256`, `SHA-512`, `MD5` (Default: `SHA-256`)
- **Response**: `200 OK`
  ```json
  {
    "hash": "...",
    "algorithm": "SHA-256"
  }
  ```

---

## 💬 Support & Admin Feedback

### 1. Submit Support/Feedback
`POST /api/support`
- **Description**: Stores support or feedback messages from authenticated users or guests.
- **Auth**: Optional.
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "subject": "Unable to decrypt file",
    "message": "I get an error when decrypting encrypted_123.bin"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "message": "Feedback submitted successfully",
    "feedbackId": "uuid"
  }
  ```

### 2. Get All Feedback (Admin Panel)
`GET /api/admin/feedback`
- **Description**: Retrieves all support/feedback entries sorted by newest first for admin panel display.
- **Response**: `200 OK`
  ```json
  [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "email": "user@example.com",
      "subject": "Unable to decrypt file",
      "message": "I get an error when decrypting encrypted_123.bin",
      "status": "OPEN",
      "createdAt": "2026-04-23T16:20:00Z"
    }
  ]
  ```

### 3. Update Feedback Status (Admin Panel)
`PATCH /api/admin/feedback/{feedbackId}/status`
- **Description**: Updates the workflow status of a support/feedback entry.
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "status": "IN_PROGRESS"
  }
  ```
- **Allowed status values**: `OPEN`, `IN_PROGRESS`, `RESOLVED`
- **Response**: `200 OK`
  ```json
  {
    "message": "Feedback status updated successfully",
    "status": "IN_PROGRESS"
  }
  ```
