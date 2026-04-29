package com.encryption.controller;

import com.encryption.dto.AuditLogDTO;
import com.encryption.dto.DecryptionRequest;
import com.encryption.dto.EncryptionResponse;
import com.encryption.exception.EncryptionException;
import com.encryption.service.AuditService;
import com.encryption.service.FileService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.InputStream;
import java.util.List;

import java.util.UUID;

@RestController
@RequestMapping("/api")
public class FileController {

    private final FileService fileService;
    private final AuditService auditService;

    public FileController(FileService fileService, AuditService auditService) {
        this.fileService = fileService;
        this.auditService = auditService;
    }


    /**
     * Encrypts and uploads a file
     * POST /api/encrypt
     */
    @PostMapping("/encrypt")
    public ResponseEntity<?> encryptFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("passphrase") String passphrase,
            @RequestParam(value = "isHoneypot", defaultValue = "false") boolean isHoneypot,
            @RequestParam(value = "decoyFile", required = false) MultipartFile decoyFile,
            @RequestParam(value = "decoyPassphrase", required = false) String decoyPassphrase,
            Authentication authentication) {
        try {
            String userId = (authentication != null) ? authentication.getName() : "anonymous-user";
            String fileName = file.getOriginalFilename();
            
            // Validate input
            if (passphrase == null || passphrase.length() < 8) {
                return ResponseEntity.badRequest()
                    .body("{\"error\": \"Passphrase must be at least 8 characters long\"}");
            }

            // Encrypt and upload using stream
            String fileId;
            try (InputStream is = file.getInputStream()) {
                fileId = fileService.encryptAndUploadFileStream(is, fileName, passphrase, userId, isHoneypot);
            }

            // Handle Deniable Encryption
            if (decoyPassphrase != null && !decoyPassphrase.isBlank()) {
                String decoyFileName = (decoyFile != null) ? decoyFile.getOriginalFilename() : fileName;
                InputStream decoyIs = (decoyFile != null) ? decoyFile.getInputStream() : file.getInputStream();
                try {
                    String decoyFileId = fileId + "_decoy";
                    fileService.encryptAndUploadFileStream(decoyIs, decoyFileName, decoyPassphrase, userId, false, decoyFileId);
                } finally {
                    decoyIs.close();
                }
            }

            // Log the operation
            auditService.logEncryption(userId, fileName, (int) file.getSize(), fileId);

            // Return response
            EncryptionResponse response = new EncryptionResponse(
                fileId,
                fileName,
                (int) file.getSize(),
                "File encrypted successfully",
                System.currentTimeMillis()
            );

            return ResponseEntity.ok(response);


        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body("{\"error\": \"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("{\"error\": \"Encryption failed: " + e.getMessage() + "\"}");
        }
    }

    /**
     * Decrypts and downloads a file
     * POST /api/decrypt/{fileId}
     */
    @PostMapping("/decrypt/{fileId}")
    public ResponseEntity<StreamingResponseBody> decryptFile(
            @PathVariable String fileId,
            @RequestBody DecryptionRequest request,
            Authentication authentication) {
        
        String userId = (authentication != null) ? authentication.getName() : "anonymous-user";

        // Validate input
        if (request.getPassphrase() == null || request.getPassphrase().length() < 8) {
            throw new IllegalArgumentException("Passphrase must be at least 8 characters long");
        }

        // Validate file ownership
        if (!fileService.validateFileOwnership(fileId, userId)) {
            throw new EncryptionException("Access denied: You do not own this file");
        }

        String downloadFileName = resolveDecryptedFileName(fileId);

        // Return decrypted file stream
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + downloadFileName + "\"")
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .body(outputStream -> {
                try {
                    // Check for Honey-Pot
                    if (fileService.isHoneypot(fileId)) {
                        auditService.logSecurityAlert(userId, fileId, "Honey-pot file accessed");
                    }
                    
                    fileService.downloadAndDecryptFileStream(fileId, request.getPassphrase(), userId, outputStream);
                    // Log the operation after successful streaming
                    auditService.logDecryption(userId, fileId, 0);
                } catch (Exception e) {
                    throw new java.io.IOException("Decryption streaming failed", e);
                }
            });
    }

    /**
     * Downloads the raw encrypted file
     * GET /api/download-encrypted/{fileId}
     */
    @GetMapping("/download-encrypted/{fileId}")
    public ResponseEntity<StreamingResponseBody> downloadEncryptedFile(
            @PathVariable String fileId,
            Authentication authentication) {
        
        String userId = (authentication != null) ? authentication.getName() : "anonymous-user";

        try {
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileId + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(outputStream -> {
                    try (InputStream is = fileService.downloadEncryptedFileStream(fileId, userId)) {
                        is.transferTo(outputStream);
                    } catch (Exception e) {
                        throw new java.io.IOException("Encryption download failed", e);
                    }
                });
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Retrieves audit logs for the authenticated user
     * GET /api/audit-logs
     */
    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs(Authentication authentication) {
        try {
            String userId = (authentication != null) ? authentication.getName() : "anonymous-user";
            boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            
            List<AuditLogDTO> auditLogs = auditService.getAuditLogs(userId, isAdmin);

            return ResponseEntity.ok(auditLogs);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("{\"error\": \"Failed to retrieve audit logs: " + e.getMessage() + "\"}");
        }
    }

    /**
     * Logs a custom action to the audit log
     * POST /api/audit/log
     */
    @PostMapping("/audit/log")
    public ResponseEntity<?> logAction(
            @RequestBody java.util.Map<String, Object> payload,
            Authentication authentication) {
        try {
            String userId = (authentication != null) ? authentication.getName() : "anonymous-user";
            
            // Allow explicit userId for signup events where JWT might not be available yet
            if ("anonymous-user".equals(userId) && payload.containsKey("userId")) {
                userId = (String) payload.get("userId");
            }

            String action = (String) payload.getOrDefault("action", "UNKNOWN_ACTION");
            String resource = (String) payload.getOrDefault("resource", "SYSTEM");
            
            // Log the action
            auditService.logActionAsync(userId, action, resource, 0);
            
            return ResponseEntity.ok().body("{\"message\": \"Action logged successfully\"}");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("{\"error\": \"Failed to log action: " + e.getMessage() + "\"}");
        }
    }

    private String resolveDecryptedFileName(String fileId) {
        if (fileId == null || fileId.isBlank()) {
            return "decrypted_file";
        }

        if (fileId.startsWith("encrypted_") && fileId.endsWith(".bin")) {
            String core = fileId.substring("encrypted_".length(), fileId.length() - ".bin".length());
            if (!core.isBlank()) {
                return "decrypted_" + core;
            }
        }

        return "decrypted_" + fileId;
    }
}
