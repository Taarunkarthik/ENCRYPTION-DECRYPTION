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
        return encryptAndUploadFileStream(inputStream, fileName, passphrase, userId, false);
    }

    public String encryptAndUploadFileStream(InputStream inputStream, String fileName, String passphrase, String userId, boolean isHoneypot) throws Exception {
        return encryptAndUploadFileStream(inputStream, fileName, passphrase, userId, isHoneypot, null);
    }

    /**
     * Encrypts and uploads file as a stream with optional Honey-Pot flag and custom file ID
     */
    public String encryptAndUploadFileStream(InputStream inputStream, String fileName, String passphrase, String userId, boolean isHoneypot, String customFileId) throws Exception {
        aesEncryptionService.validatePassphrase(passphrase);
        String fileId = (customFileId != null) ? customFileId : generateFileId(fileName, isHoneypot);

        // Process the file
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
        
        try {
            // Primary attempt
            try (InputStream encryptedStream = supabaseClient.downloadFileAsStream(BUCKET_NAME, fileId)) {
                aesEncryptionService.decryptStream(encryptedStream, outputStream, passphrase);
            }
        } catch (Exception e) {
            // Deniable Encryption: Try decoy file if primary fails
            String decoyFileId = fileId + "_decoy";
            try {
                try (InputStream decoyStream = supabaseClient.downloadFileAsStream(BUCKET_NAME, decoyFileId)) {
                    aesEncryptionService.decryptStream(decoyStream, outputStream, passphrase);
                }
            } catch (Exception decoyEx) {
                // If both fail, throw original exception or a generic one
                throw e; 
            }
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

    public boolean isHoneypot(String fileId) {
        return fileId != null && fileId.startsWith("hp_");
    }

    private String generateFileId(String fileName) {
        return generateFileId(fileName, false);
    }

    private String generateFileId(String fileName, boolean isHoneypot) {
        String prefix = isHoneypot ? "hp_" : "encrypted_";
        String uuid = UUID.randomUUID().toString();
        String extension = extractSafeExtension(fileName);
        if (extension.isEmpty()) {
            return prefix + uuid + ".bin";
        }
        return prefix + uuid + "." + extension + ".bin";
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
