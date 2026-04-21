package com.encryption.controller;

import com.encryption.dto.TextDecryptionRequest;
import com.encryption.dto.TextDecryptionResponse;
import com.encryption.dto.TextEncryptionRequest;
import com.encryption.dto.TextEncryptionResponse;
import com.encryption.service.AuditService;
import com.encryption.service.TextService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/text")
public class TextController {

    private final TextService textService;
    private final AuditService auditService;

    public TextController(TextService textService, AuditService auditService) {
        this.textService = textService;
        this.auditService = auditService;
    }

    @PostMapping("/encrypt")
    public ResponseEntity<TextEncryptionResponse> encryptText(@RequestBody TextEncryptionRequest request, Authentication authentication) {
        try {
            if (request.getText() == null || request.getText().isEmpty()) {
                return ResponseEntity.badRequest().body(new TextEncryptionResponse(null, "Text is required", System.currentTimeMillis()));
            }

            String encryptedBase64 = textService.encryptText(request.getText(), request.getPassphrase());

            // Log audit event
            String userId = (authentication != null) ? authentication.getName() : "anonymous-user";
            auditService.logActionAsync(userId, "TEXT_ENCRYPT", "TEXT_DATA", request.getText().length());

            return ResponseEntity.ok(new TextEncryptionResponse(encryptedBase64, "Text encrypted successfully", System.currentTimeMillis()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new TextEncryptionResponse(null, e.getMessage(), System.currentTimeMillis()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new TextEncryptionResponse(null, "Encryption failed: " + e.getMessage(), System.currentTimeMillis()));
        }
    }

    @PostMapping("/decrypt")
    public ResponseEntity<TextDecryptionResponse> decryptText(@RequestBody TextDecryptionRequest request, Authentication authentication) {
        try {
            if (request.getEncryptedTextBase64() == null || request.getEncryptedTextBase64().isEmpty()) {
                return ResponseEntity.badRequest().body(new TextDecryptionResponse(null, "Encrypted text is required", System.currentTimeMillis()));
            }

            String decryptedText = textService.decryptText(request.getEncryptedTextBase64(), request.getPassphrase());

            // Log audit event
            String userId = (authentication != null) ? authentication.getName() : "anonymous-user";
            auditService.logActionAsync(userId, "TEXT_DECRYPT", "TEXT_DATA", request.getEncryptedTextBase64().length());

            return ResponseEntity.ok(new TextDecryptionResponse(decryptedText, "Text decrypted successfully", System.currentTimeMillis()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new TextDecryptionResponse(null, "Invalid passphrase or corrupted data", System.currentTimeMillis()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new TextDecryptionResponse(null, "Decryption failed: " + e.getMessage(), System.currentTimeMillis()));
        }
    }
}
