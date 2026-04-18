package com.encryption.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Service for logging operations to Supabase audit log table.
 * All logging is performed asynchronously to avoid blocking file operations.
 */
@Slf4j
@Service
public class AuditService {

    private final SupabaseClient supabaseClient;

    public AuditService(SupabaseClient supabaseClient) {
        this.supabaseClient = supabaseClient;
    }

    /**
     * Log file encryption operation asynchronously.
     */
    @Async
    public void logEncryption(String userId, String fileName, Long fileSizeBytes) {
        try {
            supabaseClient.insertAuditLog(userId, "ENCRYPT", fileName, fileSizeBytes);
            log.debug("Logged encryption operation for user: {} (file: {})", userId, fileName);
        } catch (Exception ex) {
            log.error("Failed to log encryption operation: {}", ex.getMessage());
        }
    }

    /**
     * Log file decryption operation asynchronously.
     */
    @Async
    public void logDecryption(String userId, String fileId, Long fileSizeBytes) {
        try {
            supabaseClient.insertAuditLog(userId, "DECRYPT", fileId, fileSizeBytes);
            log.debug("Logged decryption operation for user: {} (file: {})", userId, fileId);
        } catch (Exception ex) {
            log.error("Failed to log decryption operation: {}", ex.getMessage());
        }
    }
}
