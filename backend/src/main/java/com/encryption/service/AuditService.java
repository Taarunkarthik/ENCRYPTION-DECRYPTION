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
            // Admins see EVERYTHING
            filter = "select=*&order=created_at.desc";
            System.out.println("ADMIN ACCESS: Retrieving all audit logs");
        } else {
            // Normal users only see their own logs
            if (userId == null || userId.isEmpty() || "anonymous-user".equals(userId)) {
                // Guests should not see any logs (or only their own if we had session tracking)
                // For now, guests see nothing to prevent seeing "everyone's" anonymous logs
                System.out.println("GUEST ACCESS: Denying audit log retrieval");
                return Collections.emptyList();
            }
            
            // Explicitly filter by the authenticated UUID
            filter = "select=*&user_id=eq." + userId + "&order=created_at.desc";
            System.out.println("USER ACCESS: Filtering logs for user_id=" + userId);
        }
        
        String response;
        try {
            response = supabaseClient.queryRecords(TABLE_NAME, filter);
        } catch (Exception e) {
            System.err.println("Database query failed for table " + TABLE_NAME + ": " + e.getMessage());
            throw new Exception("Failed to query records: " + e.getMessage());
        }

        // Parse JSON response
        List<AuditLogDTO> auditLogs = new ArrayList<>();
        if (response != null && !response.trim().isEmpty() && !response.equals("null")) {
            try {
                AuditLogDTO[] logs = objectMapper.readValue(response, AuditLogDTO[].class);
                auditLogs = Arrays.asList(logs);
            } catch (Exception e) {
                System.err.println("Failed to parse audit logs JSON: " + e.getMessage() + ". Response: " + response);
                // If it looks like a Supabase error (contains "message"), throw that specifically
                if (response.contains("\"message\":")) {
                    throw new Exception("Supabase Error: " + response);
                }
                throw e;
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
        if ("anonymous-user".equals(userId) || userId == null || userId.isEmpty()) {
            data.put("user_id", null);
        } else {
            data.put("user_id", userId);
        }
        
        data.put("action", auditLog.getAction());
        data.put("file_name", auditLog.getFileName());
        data.put("file_size_bytes", auditLog.getFileSizeBytes());
        data.put("created_at", auditLog.getCreatedAt());

        supabaseClient.insertRecord(TABLE_NAME, data);
    }
}
