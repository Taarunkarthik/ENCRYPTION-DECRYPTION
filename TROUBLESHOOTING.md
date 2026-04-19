# 🛠️ Troubleshooting Guide

Common issues and solutions for the File Encryption & Decryption Web App.

## 1. Authentication Issues

### Symptom: "Invalid or expired JWT token"
- **Cause**: The token sent in the `Authorization` header is invalid or has expired (default expiry is 1 hour).
- **Solution**: 
  - Log out and log back in to refresh the session.
  - Check if the `SUPABASE_JWT_SECRET` in your backend `.env` matches your Supabase Project Settings -> API -> JWT Secret.

### Symptom: "Failed to sign up: email rate limit exceeded"
- **Cause**: Supabase free tier has a limit on how many emails can be sent per hour.
- **Solution**: 
  - Disable "Confirm email" in Supabase Dashboard -> Authentication -> Providers -> Email.
  - Wait for an hour and try again.

---

## 2. Encryption/Decryption Failures

### Symptom: "Decryption failed: Invalid passphrase or corrupted file"
- **Cause**: The passphrase entered does not match the one used during encryption, or the encrypted file was modified.
- **Solution**: 
  - Ensure you are using the exact same passphrase.
  - Verify that the file hasn't been corrupted.

### Symptom: "Access denied: You do not own this file"
- **Cause**: You are trying to decrypt a file that was encrypted by a different user.
- **Solution**: Only the user who encrypted the file can decrypt it (unless sharing features are implemented in the future).

---

## 3. Deployment Issues

### Symptom: "Connection refused" when connecting to backend from frontend
- **Cause**: The backend is not running or is blocked by a firewall.
- **Solution**:
  - Check if the backend is running: `docker ps` or check the terminal.
  - Verify `VITE_API_BASE_URL` in frontend `.env` is correct.
  - Ensure `CORS_ALLOWED_ORIGINS` in backend `.env` includes the frontend URL.

### Symptom: "OutOfMemoryError" with large files
- **Cause**: The JVM heap size is too small for the file being processed.
- **Solution**:
  - Our implementation uses streaming to handle large files, so memory usage should be constant. If you still see this, ensure you are using the `/api/encrypt` and `/api/decrypt` endpoints which support streaming.
  - Increase JVM heap size if necessary: `-Xmx2g`.

---

## 4. Docker Issues

### Symptom: "Docker daemon is not running"
- **Solution**: Start Docker Desktop or the Docker engine on your machine.

### Symptom: "Image build failed"
- **Solution**:
  - Check your internet connection (needed to download base images and dependencies).
  - Ensure you have enough disk space.
  - Run `docker system prune` to clear old cache if needed.

---

## 5. Email Deliverability & SMTP Warnings

### Symptom: Received email warning about "sending limits" or "delivery metrics"
- **Cause**: You are likely using the default Supabase SMTP relay on the free tier. This relay is intended for testing and has strict limits (~3 emails/hour, ~20 emails/day). Sending test emails to invalid addresses or hitting these limits triggers security warnings.
- **Solution**:
  - **For Development**: Disable email confirmation to avoid triggering emails entirely.
    - Go to **Supabase Dashboard** -> **Authentication** -> **Providers** -> **Email**.
    - Toggle off **Confirm email**.
  - **For Testing**: Use dedicated testing tools like [Mailtrap](https://mailtrap.io/) or [Ethereal Email](https://ethereal.email/) by setting up a custom SMTP provider.
  - **For Production**: Set up a custom SMTP provider (e.g., Resend, SendGrid, AWS SES) in the Supabase Dashboard under **Project Settings** -> **Authentication** -> **SMTP**.
