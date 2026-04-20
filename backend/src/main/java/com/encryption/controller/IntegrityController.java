package com.encryption.controller;

import com.encryption.service.AuditService;
import com.encryption.service.IntegrityService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/integrity")
@CrossOrigin(origins = "${cors.allowed.origins:*}")
public class IntegrityController {

    private final IntegrityService integrityService;
    private final AuditService auditService;

    public IntegrityController(IntegrityService integrityService, AuditService auditService) {
        this.integrityService = integrityService;
        this.auditService = auditService;
    }

    /**
     * Computes cryptographic hashes (MD5, SHA-1, SHA-256, SHA-512) for an uploaded file.
     * POST /api/integrity/hash
     */
    @PostMapping(value = "/hash", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> computeHash(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is required"));
            }

            Map<String, String> hashes;
            try (java.io.InputStream is = file.getInputStream()) {
                hashes = integrityService.computeHashesStream(is);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("fileName", file.getOriginalFilename());
            response.put("fileSize", file.getSize());
            response.put("hashes", hashes);
            response.put("message", "Hashes computed successfully");
            response.put("timestamp", System.currentTimeMillis());

            String userId = (authentication != null) ? authentication.getName() : "anonymous-user";
            auditService.logActionAsync(userId, "INTEGRITY_CHECK", file.getOriginalFilename(), (int) file.getSize());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Hash computation failed: " + e.getMessage()));
        }
    }
}
