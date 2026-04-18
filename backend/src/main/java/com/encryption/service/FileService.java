package com.encryption.service;

import com.encryption.crypto.AesEncryptionService;
import com.encryption.exception.EncryptionException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.UUID;

/**
 * Service for handling file encryption, decryption, and storage operations.
 * Integrates encryption service with Supabase Storage.
 */
@Slf4j
@Service
public class FileService {

    private final AesEncryptionService aesEncryptionService;
    private final SupabaseClient supabaseClient;
    private final AuditService auditService;

    public FileService(AesEncryptionService aesEncryptionService, 
                      SupabaseClient supabaseClient,
                      AuditService auditService) {
        this.aesEncryptionService = aesEncryptionService;
        this.supabaseClient = supabaseClient;
        this.auditService = auditService;
    }

    /**
     * Encrypt file and upload to Supabase Storage.
     */
    public String encryptAndUploadFile(MultipartFile file, String passphrase, String userId) throws EncryptionException {
        try {
            log.debug("Starting encryption for file: {} (size: {} bytes)", file.getOriginalFilename(), file.getSize());

            // Encrypt the file
            byte[] encryptedData = aesEncryptionService.encryptFile(
                    file.getInputStream(),
                    passphrase
            );

            log.debug("File encrypted successfully, size: {} bytes", encryptedData.length);

            // Generate unique file ID
            String fileId = "encrypted_" + UUID.randomUUID() + ".bin";

            // Upload to Supabase Storage
            String storagePath = supabaseClient.uploadFile(encryptedData, fileId, userId);
            log.debug("File uploaded to Supabase Storage: {}", storagePath);

            // Log the operation (async)
            auditService.logEncryption(userId, file.getOriginalFilename(), file.getSize());

            return fileId;
        } catch (Exception ex) {
            log.error("Encryption and upload failed: {}", ex.getMessage(), ex);
            throw new EncryptionException("Failed to encrypt and upload file: " + ex.getMessage(), ex);
        }
    }

    /**
     * Download and decrypt file from Supabase Storage.
     */
    public byte[] downloadAndDecryptFile(String fileId, String passphrase, String userId) throws EncryptionException {
        try {
            log.debug("Starting decryption for file: {} (user: {})", fileId, userId);

            // Download from Supabase Storage
            String filePath = userId + "/" + fileId;
            byte[] encryptedData = supabaseClient.downloadFile(filePath);

            log.debug("File downloaded from Supabase Storage, size: {} bytes", encryptedData.length);

            // Decrypt the file
            ByteArrayInputStream inputStream = new ByteArrayInputStream(encryptedData);
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

            aesEncryptionService.decryptFile(inputStream, outputStream, passphrase);

            byte[] decryptedData = outputStream.toByteArray();
            log.debug("File decrypted successfully, size: {} bytes", decryptedData.length);

            // Log the operation (async)
            auditService.logDecryption(userId, fileId, (long) encryptedData.length);

            return decryptedData;
        } catch (Exception ex) {
            log.error("Decryption and download failed: {}", ex.getMessage(), ex);
            throw new EncryptionException("Failed to decrypt and download file: " + ex.getMessage(), ex);
        }
    }
}
