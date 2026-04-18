package com.encryption.controller;

import com.encryption.dto.EncryptionResponse;
import com.encryption.exception.EncryptionException;
import com.encryption.service.AuditService;
import com.encryption.service.FileService;
import com.encryption.service.SupabaseClient;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * REST Controller for file encryption and decryption operations.
 * All endpoints require JWT authentication.
 */
@Slf4j
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "${spring.web.cors.allowed-origins:http://localhost:5173}")
public class FileController {

    private final FileService fileService;
    private final SupabaseClient supabaseClient;
    private final AuditService auditService;

    public FileController(FileService fileService, 
                         SupabaseClient supabaseClient,
                         AuditService auditService) {
        this.fileService = fileService;
        this.supabaseClient = supabaseClient;
        this.auditService = auditService;
    }

    /**
     * Upload and encrypt a file.
     * POST /api/encrypt
     */
    @PostMapping("/encrypt")
    public ResponseEntity<?> encryptFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("passphrase") String passphrase,
            Authentication authentication) {
        
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new HashMap<String, String>() {{
                            put("error", "Unauthorized");
                            put("message", "User not authenticated");
                        }});
            }

            String userId = (String) authentication.getPrincipal();
            log.info("Received encryption request from user: {} for file: {}", userId, file.getOriginalFilename());

            // Validate inputs
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new HashMap<String, String>() {{
                            put("error", "Invalid request");
                            put("message", "File is empty");
                        }});
            }

            if (passphrase == null || passphrase.length() < 8) {
                return ResponseEntity.badRequest()
                        .body(new HashMap<String, String>() {{
                            put("error", "Invalid request");
                            put("message", "Passphrase must be at least 8 characters");
                        }});
            }

            // Encrypt and upload
            String fileId = fileService.encryptAndUploadFile(file, passphrase, userId);

            EncryptionResponse response = EncryptionResponse.builder()
                    .fileId(fileId)
                    .fileName(file.getOriginalFilename())
                    .fileSizeBytes(file.getSize())
                    .message("File encrypted successfully")
                    .timestamp(Instant.now().toEpochMilli())
                    .build();

            log.info("File encrypted successfully: {} (fileId: {})", file.getOriginalFilename(), fileId);
            return ResponseEntity.ok(response);

        } catch (EncryptionException ex) {
            log.error("Encryption error: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new HashMap<String, String>() {{
                        put("error", "Encryption failed");
                        put("message", ex.getMessage());
                    }});
        } catch (Exception ex) {
            log.error("Unexpected error during encryption: {}", ex.getMessage(), ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new HashMap<String, String>() {{
                        put("error", "Internal server error");
                        put("message", "An unexpected error occurred");
                    }});
        }
    }

    /**
     * Download and decrypt a file.
     * POST /api/decrypt/{fileId}
     */
    @PostMapping("/decrypt/{fileId}")
    public ResponseEntity<?> decryptFile(
            @PathVariable String fileId,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new HashMap<String, String>() {{
                            put("error", "Unauthorized");
                            put("message", "User not authenticated");
                        }});
            }

            String userId = (String) authentication.getPrincipal();
            String passphrase = body.get("passphrase");

            log.info("Received decryption request from user: {} for file: {}", userId, fileId);

            if (passphrase == null || passphrase.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new HashMap<String, String>() {{
                            put("error", "Invalid request");
                            put("message", "Passphrase is required");
                        }});
            }

            // Decrypt and download
            byte[] decryptedData = fileService.downloadAndDecryptFile(fileId, passphrase, userId);

            log.info("File decrypted successfully: {}", fileId);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"decrypted_file\"")
                    .header(HttpHeaders.CONTENT_TYPE, "application/octet-stream")
                    .body(decryptedData);

        } catch (EncryptionException ex) {
            log.error("Decryption error: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new HashMap<String, String>() {{
                        put("error", "Decryption failed");
                        put("message", ex.getMessage());
                    }});
        } catch (Exception ex) {
            log.error("Unexpected error during decryption: {}", ex.getMessage(), ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new HashMap<String, String>() {{
                        put("error", "Internal server error");
                        put("message", "An unexpected error occurred");
                    }});
        }
    }

    /**
     * Get audit logs for the authenticated user.
     * GET /api/audit-logs
     */
    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs(Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new HashMap<String, String>() {{
                            put("error", "Unauthorized");
                            put("message", "User not authenticated");
                        }});
            }

            String userId = (String) authentication.getPrincipal();
            log.info("Fetching audit logs for user: {}", userId);

            ArrayNode logs = supabaseClient.fetchAuditLogs(userId);

            return ResponseEntity.ok(logs);

        } catch (Exception ex) {
            log.error("Error fetching audit logs: {}", ex.getMessage(), ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new HashMap<String, String>() {{
                        put("error", "Internal server error");
                        put("message", "Failed to fetch audit logs");
                    }});
        }
    }

    /**
     * Health check endpoint.
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(new HashMap<String, String>() {{
            put("status", "UP");
            put("service", "File Encryption Service");
        }});
    }
}
