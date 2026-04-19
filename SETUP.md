# Backend Setup Guide

## Prerequisites

- Java 21+
- Gradle 8.10.2 (included in `backend/gradle-8.10.2/` or system-installed)
- Supabase account (free tier: https://supabase.com)
- Environment variables configured in `.env`

## Step 1: Create Supabase Project

1. Go to https://supabase.com and create a new project
2. Set a strong database password
3. Wait for the project to be provisioned
4. **Important**: For local development, disable email confirmation to avoid hitting Supabase SMTP limits:
   - Go to **Authentication -> Providers -> Email**
   - Toggle off **Confirm email**
   - This allows you to sign up test users without triggering real emails.

## Step 2: Get Supabase Credentials

In your Supabase dashboard, go to **Settings → API**:

- **Project URL**: Copy this (e.g., `https://your-project.supabase.co`)
- **Anon Public Key**: Copy the public API key
- **Service Role Secret**: Copy the service role key
- **JWT Secret**: Copy the JWT secret from **Settings → Configuration** (under JWT Settings)

## Step 3: Create .env File

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-secret-key-min-32-chars
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Step 4: Set Up Supabase Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Create a new query and execute the SQL from `sql/init.sql`:
   ```sql
   -- Copy and paste contents of sql/init.sql
   ```
3. This creates:
   - `audit_logs` table with RLS policies
   - Indexes for performance
   - Foreign key relationships

## Step 5: Create Storage Bucket

1. In your Supabase dashboard, go to **Storage**
2. Create a new bucket named `encrypted_bucket`
3. Make it **Private** (restrict access)
4. Configure RLS policies to restrict access per user

## Step 6: Build the Backend

```bash
cd backend

# On Windows
gradlew.bat build

# On Linux/Mac
./gradlew build
```

This will:
- Download all Maven dependencies
- Compile Java source files
- Run unit tests
- Create `build/libs/encryption-decryption-backend-1.0.0.jar`

## Step 7: Run the Application

```bash
# Using Gradle
./gradlew bootRun

# Or run the JAR directly
java -jar build/libs/encryption-decryption-backend-1.0.0.jar
```

The server will start on `http://localhost:8080`

Verify health:
```bash
curl http://localhost:8080/api/health
# Response: {"status": "UP", "service": "File Encryption Service"}
```

## Step 8: Test Endpoints (After Authentication)

### Get JWT Token from Frontend

1. Start the frontend (see frontend README)
2. Sign in with a test account
3. Grab the JWT token from the browser console (in localStorage or network tab)

### Test Encryption Endpoint

```bash
curl -X POST http://localhost:8080/api/encrypt \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@path/to/test-file.txt" \
  -F "passphrase=SecurePassphrase123!"
```

Response:
```json
{
  "fileId": "encrypted_a1b2c3d4-e5f6-7890-abcd-ef1234567890.bin",
  "fileName": "test-file.txt",
  "fileSizeBytes": 1024,
  "message": "File encrypted successfully",
  "timestamp": 1698000000000
}
```

### Test Decryption Endpoint

```bash
curl -X POST http://localhost:8080/api/decrypt/encrypted_a1b2c3d4-e5f6-7890-abcd-ef1234567890.bin \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"passphrase": "SecurePassphrase123!"}' \
  -o decrypted-file.txt
```

### Get Audit Logs

```bash
curl -X GET http://localhost:8080/api/audit-logs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
[
  {
    "id": "uuid-1",
    "user_id": "uuid-user",
    "action": "ENCRYPT",
    "file_name": "test-file.txt",
    "file_size_bytes": 1024,
    "created_at": "2024-04-19T10:30:00Z"
  }
]
```

## Troubleshooting

### Build Fails: "Gradle not found"

1. Ensure Gradle 8.10.2 is installed or available in `backend/gradle-8.10.2/`
2. Set `GRADLE_HOME` environment variable if needed:
   ```bash
   export GRADLE_HOME=/path/to/gradle-8.10.2
   export PATH=$GRADLE_HOME/bin:$PATH
   ```

### Application Won't Start: "SUPABASE_JWT_SECRET not found"

- Ensure `.env` file exists in the project root
- Verify all Supabase credentials are correctly set
- Check that environment variables are loaded (Spring Boot reads from `.env`)

### JWT Token Invalid

- Verify the JWT token is from a Supabase authenticated user
- Check token expiry (default: 1 hour)
- Ensure `SUPABASE_JWT_SECRET` matches your Supabase project settings

### File Upload Fails

- Verify `encrypted_bucket` exists in Supabase Storage
- Check Storage bucket permissions (should be Private)
- Ensure service role key has permissions to write to the bucket

### Database Query Fails

- Verify `audit_logs` table was created via `sql/init.sql`
- Check RLS policies are enabled on the table
- Ensure service role key has admin privileges

## Docker Deployment

```bash
# Build Docker image
docker build -t encryption-backend:latest .

# Run container with .env
docker run -p 8080:8080 --env-file .env encryption-backend:latest

# Or set environment variables explicitly
docker run -p 8080:8080 \
  -e SUPABASE_URL=https://your-project.supabase.co \
  -e SUPABASE_JWT_SECRET=your-secret \
  encryption-backend:latest
```

## Next Steps

1. **Frontend Integration**: Set up the React frontend (see `frontend/README.md`)
2. **Complete Phase 3**: Implement React components and pages
3. **Testing**: Run integration tests with both frontend and backend
4. **Deployment**: Deploy to production (Docker, Kubernetes, Cloud Run, etc.)

## Architecture Notes

```
User (Browser)
    ↓
Frontend (React + Vite)
    ↓
JWT Token (Supabase Auth)
    ↓
Backend (Spring Boot)
    ├→ JwtFilter (validates token)
    ├→ FileController (REST endpoints)
    ├→ FileService (encryption/file ops)
    ├→ AuditService (logging)
    └→ AesEncryptionService (crypto)
    ↓
Supabase
    ├→ Auth (JWT validation)
    ├→ Storage (encrypted files)
    └→ Database (audit logs)
```

## Performance Tips

1. **Large Files**: Use streaming for files > 100MB
2. **Concurrent Operations**: Increase thread pool size in `application.yml`
3. **Caching**: Consider caching audit logs with Redis
4. **Monitoring**: Set up application monitoring (Spring Boot Actuator)

## Security Checklist

- [ ] HTTPS enabled in production
- [ ] Supabase JWT secret is strong (min 32 chars)
- [ ] CORS only allows trusted origins
- [ ] Storage bucket is Private, not Public
- [ ] RLS policies restrict file access to owners only
- [ ] Rate limiting configured on sensitive endpoints
- [ ] Logs don't expose sensitive data
- [ ] Database backups enabled
- [ ] Secrets stored securely (not in code/git)

## Support

For issues:
1. Check application logs: `backend/build/logs/`
2. Review Supabase dashboard for errors
3. Check browser console for frontend errors
4. Refer to README.md files in `backend/` and `frontend/`
