package com.encryption.service;

import com.encryption.crypto.AesEncryptionService;
import com.encryption.crypto.EncryptedOutput;
import com.encryption.util.SupabaseClient;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.io.OutputStream;
import java.util.Locale;
import java.util.UUID;

@Service
public class FileService {

    private final AesEncryptionService aesEncryptionService;
    private final SupabaseClient supabaseClient;
    private static final String BUCKET_NAME = "encrypted_bucket";

    public FileService(AesEncryptionService aesEncryptionService, SupabaseClient supabaseClient) {
        this.aesEncryptionService = aesEncryptionService;
        this.supabaseClient = supabaseClient;
    }

    /**
     * Encrypts and uploads file to Supabase Storage
     */
    public String encryptAndUploadFile(byte[] fileContent, String fileName, String passphrase, String userId) throws Exception {
        // Validate passphrase
        aesEncryptionService.validatePassphrase(passphrase);

        // Encrypt the file
        EncryptedOutput encryptedOutput = aesEncryptionService.encrypt(fileContent, passphrase);

        // Generate unique file ID
        String fileId = generateFileId(fileName);

        // TODO: Upload to Supabase Storage
        // This requires Supabase API integration
        uploadToSupabaseStorage(fileId, encryptedOutput, userId);

        return fileId;
    }

    /**
     * Downloads and decrypts file from Supabase Storage
     */
    public byte[] downloadAndDecryptFile(String fileId, String passphrase, String userId) throws Exception {
        // Validate passphrase
        aesEncryptionService.validatePassphrase(passphrase);

        // Download from Supabase Storage
        EncryptedOutput encryptedOutput = downloadFromSupabaseStorage(fileId, userId);

        if (encryptedOutput == null) {
            throw new IllegalArgumentException("File not found: " + fileId);
        }

    // Decrypt the file
        return aesEncryptionService.decrypt(
            encryptedOutput.getCiphertext(), 
            passphrase, 
            encryptedOutput.getSalt(), 
            encryptedOutput.getGcmTag(), 
            encryptedOutput.getIv()
        );
    }

    /**
     * Encrypts and uploads file as a stream
     */
    public String encryptAndUploadFileStream(InputStream inputStream, String fileName, String passphrase, String userId) throws Exception {
        aesEncryptionService.validatePassphrase(passphrase);
        String fileId = generateFileId(fileName);

        // We need to write to a temporary file or a buffer because OkHttp RequestBody.create(InputStream)
        // usually needs to know the length or uses chunked encoding which Supabase might not like
        // For now, let's use a temporary file to simulate streaming to disk first
        java.io.File tempFile = java.io.File.createTempFile("enc_", ".tmp");
        try (java.io.FileOutputStream fos = new java.io.FileOutputStream(tempFile)) {
            aesEncryptionService.encryptStream(inputStream, fos, passphrase);
        }

        // Upload the encrypted file
        byte[] encryptedData = java.nio.file.Files.readAllBytes(tempFile.toPath());
        supabaseClient.uploadFile(BUCKET_NAME, fileId, encryptedData);
        
        tempFile.delete();
        return fileId;
    }

    /**
     * Downloads and decrypts file as a stream
     */
    public void downloadAndDecryptFileStream(String fileId, String passphrase, String userId, OutputStream outputStream) throws Exception {
        aesEncryptionService.validatePassphrase(passphrase);
        
        try (InputStream encryptedStream = supabaseClient.downloadFileAsStream(BUCKET_NAME, fileId)) {
            aesEncryptionService.decryptStream(encryptedStream, outputStream, passphrase);
        }
    }

    /**
     * Downloads raw encrypted file as a stream
     */
    public InputStream downloadEncryptedFileStream(String fileId, String userId) throws Exception {
        // Validate file ownership
        if (!validateFileOwnership(fileId, userId)) {
            throw new IllegalArgumentException("Access denied: You do not own this file");
        }
        return supabaseClient.downloadFileAsStream(BUCKET_NAME, fileId);
    }


    /**
     * Uploads encrypted file to Supabase Storage
     */
    private void uploadToSupabaseStorage(String fileId, EncryptedOutput encryptedOutput, String userId) throws Exception {
        byte[] encryptedData = encryptedOutput.toByteArray();
        supabaseClient.uploadFile(BUCKET_NAME, fileId, encryptedData);
    }

    /**
     * Downloads encrypted file from Supabase Storage
     */
    private EncryptedOutput downloadFromSupabaseStorage(String fileId, String userId) throws Exception {
        byte[] encryptedData = supabaseClient.downloadFile(BUCKET_NAME, fileId);

        if (encryptedData == null || encryptedData.length < 48) {
            return null; // IV (16) + Salt (16) + GCM Tag (16) minimum
        }

        int offset = 0;
        
        // Extract IV (first 16 bytes)
        byte[] iv = new byte[16];
        System.arraycopy(encryptedData, offset, iv, 0, 16);
        offset += 16;

        // Extract Salt (next 16 bytes)
        byte[] salt = new byte[16];
        System.arraycopy(encryptedData, offset, salt, 0, 16);
        offset += 16;

        // Extract GCM Tag (last 16 bytes)
        byte[] gcmTag = new byte[16];
        System.arraycopy(encryptedData, encryptedData.length - 16, gcmTag, 0, 16);

        // Extract Ciphertext (remaining bytes between salt and tag)
        byte[] ciphertext = new byte[encryptedData.length - 48];
        System.arraycopy(encryptedData, offset, ciphertext, 0, ciphertext.length);

        return new EncryptedOutput(iv, salt, ciphertext, gcmTag);
    }

    /**
     * Validates file size
     */
    public void validateFileSize(byte[] fileContent, long maxSizeBytes) throws IllegalArgumentException {
        if (fileContent.length > maxSizeBytes) {
            throw new IllegalArgumentException("File size exceeds maximum allowed size of " + maxSizeBytes + " bytes");
        }
    }

    /**
     * Validates file ownership (checks if user owns the file)
     */
    public boolean validateFileOwnership(String fileId, String userId) {
        // TODO: Query Supabase to verify file ownership
        return true;
    }

    private String generateFileId(String fileName) {
        String uuid = UUID.randomUUID().toString();
        String extension = extractSafeExtension(fileName);
        if (extension.isEmpty()) {
            return "encrypted_" + uuid + ".bin";
        }
        return "encrypted_" + uuid + "." + extension + ".bin";
    }

    private String extractSafeExtension(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return "";
        }

        int lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex < 0 || lastDotIndex == fileName.length() - 1) {
            return "";
        }

        String rawExtension = fileName.substring(lastDotIndex + 1).toLowerCase(Locale.ROOT);
        if (rawExtension.length() > 10) {
            return "";
        }

        for (int i = 0; i < rawExtension.length(); i++) {
            if (!Character.isLetterOrDigit(rawExtension.charAt(i))) {
                return "";
            }
        }
        return rawExtension;
    }
}
