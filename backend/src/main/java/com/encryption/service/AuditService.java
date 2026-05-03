package com.encryption.service;

import com.encryption.dto.AuditLogDTO;
import com.encryption.util.SupabaseClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.*;

@Service
public class AuditService {

    private final SupabaseClient supabaseClient;
    private final ObjectMapper objectMapper;
    private static final String TABLE_NAME = "audit_logs";
    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(AuditService.class);

    public AuditService(SupabaseClient supabaseClient) {
        this.supabaseClient = supabaseClient;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Logs encryption operation asynchronously
     */
    @Async
    public void logEncryption(String userId, String fileName, long fileSizeBytes) {
        logEncryption(userId, fileName, fileSizeBytes, null);
    }

    /**
     * Logs encryption operation asynchronously with optional file id context.
     */
    @Async
    public void logEncryption(String userId, String fileName, long fileSizeBytes, String fileId) {
        if (!supabaseClient.isConfigured()) {
            return;
        }
        try {
            String loggedFileName = fileName;
            if (fileId != null && !fileId.isBlank()) {
                // Append fileId when available so UI can recover identifiers from logs.
                loggedFileName = fileName + " [ID: " + fileId + "]";
            }
            
            AuditLogDTO auditLog = new AuditLogDTO(
                UUID.randomUUID().toString(),
                userId,
                "ENCRYPT",
                loggedFileName,
                fileSizeBytes,
                Instant.now().toString()
            );

            insertAuditLog(auditLog);
        } catch (Exception e) {
            // Log error but don't throw (async operation)
            System.err.println("Failed to log encryption operation: " + e.getMessage());
        }
    }

    /**
     * Logs decryption operation asynchronously
     */
    @Async
    public void logDecryption(String userId, String fileName, long fileSizeBytes) {
        logActionAsync(userId, "DECRYPT", fileName, fileSizeBytes);
    }

    /**
     * Logs a security alert (e.g. Honey-Pot trigger)
     */
    @Async
    public void logSecurityAlert(String userId, String fileName, String detail) {
        logActionAsync(userId, "SECURITY_ALERT", fileName + " (" + detail + ")", 0);
    }

    /**
     * Generic asynchronous action logger
     */
    @Async
    public void logActionAsync(String userId, String action, String fileName, long fileSizeBytes) {
        if (!supabaseClient.isConfigured()) {
            return;
        }
        try {
            AuditLogDTO auditLog = new AuditLogDTO(
                UUID.randomUUID().toString(),
                userId,
                action,
                fileName,
                fileSizeBytes,
                Instant.now().toString()
            );

            insertAuditLog(auditLog);
        } catch (Exception e) {
            System.err.println("Failed to log " + action + " operation: " + e.getMessage());
        }
    }

    /**
     * Retrieves audit logs. If isAdmin is true, retrieves all logs.
     */
    public List<AuditLogDTO> getAuditLogs(String userId, boolean isAdmin) throws Exception {
        if (!supabaseClient.isConfigured()) {
            return Collections.emptyList();
        }
        String filter;
        if (isAdmin) {
            // Admins see EVERYTHING with user profiles joined (explicitly link via user_id)
            filter = "select=*,profiles:user_id(email)&order=created_at.desc";
            System.out.println("ADMIN ACCESS: Retrieving all audit logs");
        } else if (userId == null || "anonymous-user".equals(userId) || userId.length() < 32) {
            // Guests or invalid IDs see nothing
            System.out.println("USER ACCESS: Guest or invalid identity detected, returning empty logs");
            return Collections.emptyList();
        } else {
            // USERS see ONLY THEIR OWN logs
            filter = "user_id=eq." + userId + "&select=*&order=created_at.desc";
            System.out.println("USER ACCESS: Retrieving logs for user: " + userId);
        }
        
        String response;
        try {
            response = supabaseClient.queryRecords(TABLE_NAME, filter);
        } catch (Exception e) {
            logger.error("Database query failed for table {} with filter: {}. Error: {}", TABLE_NAME, filter, e.getMessage());
            
            // FALLBACK: If join fails (e.g. profiles table doesn't exist), try simple select
            if (isAdmin && filter.contains("profiles")) {
                logger.info("ADMIN FALLBACK: Join with profiles failed, retrying with simple select...");
                filter = "select=*&order=created_at.desc";
                try {
                    response = supabaseClient.queryRecords(TABLE_NAME, filter);
                } catch (Exception e2) {
                    logger.error("CRITICAL: Fallback query also failed: {}", e2.getMessage());
                    throw new Exception("Critical database failure during fallback: " + e2.getMessage());
                }
            } else {
                throw new Exception("Failed to query audit records: " + e.getMessage());
            }
        }

        // Parse JSON response
        List<AuditLogDTO> auditLogs = new ArrayList<>();
        if (response != null && !response.trim().isEmpty() && !response.equals("null")) {
            try {
                AuditLogDTO[] logs = objectMapper.readValue(response, AuditLogDTO[].class);
                auditLogs = Arrays.asList(logs);
            } catch (Exception e) {
                System.err.println("CRITICAL: Failed to parse audit logs JSON. Raw response: " + response);
                // If it looks like a Supabase error (contains "message"), throw that specifically
                if (response != null && response.contains("\"message\":")) {
                    throw new Exception("Supabase Database Error: " + response);
                }
                throw new Exception("JSON Parsing Error: " + e.getMessage() + " | Raw: " + response);
            }
        }

        return auditLogs;
    }

    /**
     * Inserts audit log entry into Supabase
     */
    private void insertAuditLog(AuditLogDTO auditLog) throws Exception {
        Map<String, Object> data = new HashMap<>();
        data.put("id", auditLog.getId());
        
        // Handle anonymous user by setting user_id to null (database UUID type)
        String userId = auditLog.getUserId();
        // Only insert if it looks like a valid UUID (usually 36 chars with hyphens, but we check for 32+)
        if (userId != null && userId.length() >= 32 && !userId.equals("anonymous-user")) {
            data.put("user_id", userId);
        } else {
            data.put("user_id", null);
        }
        
        data.put("action", auditLog.getAction());
        data.put("file_name", auditLog.getFileName());
        data.put("file_size_bytes", auditLog.getFileSizeBytes());
        data.put("created_at", auditLog.getCreatedAt());

        supabaseClient.insertRecord(TABLE_NAME, data);
    }
}
