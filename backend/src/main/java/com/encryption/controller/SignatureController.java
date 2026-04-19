package com.encryption.controller;

import com.encryption.service.AuditService;
import com.encryption.service.SignatureService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/signature")
@CrossOrigin(origins = "${cors.allowed.origins:*}")
public class SignatureController {

    private final SignatureService signatureService;
    private final AuditService auditService;

    public SignatureController(SignatureService signatureService, AuditService auditService) {
        this.signatureService = signatureService;
        this.auditService = auditService;
    }

    /**
     * Generates a new RSA key pair.
     * GET /api/signature/generate-keypair
     */
    @GetMapping("/generate-keypair")
    public ResponseEntity<?> generateKeyPair(Authentication authentication) {
        try {
            SignatureService.KeyPairResult keyPair = signatureService.generateKeyPair();
            Map<String, String> response = new HashMap<>();
            response.put("privateKey", keyPair.getPrivateKeyBase64());
            response.put("publicKey", keyPair.getPublicKeyBase64());
            response.put("algorithm", "RSA-2048");
            response.put("message", "Key pair generated successfully. Save your private key securely!");

            if (authentication != null && authentication.getName() != null) {
                auditService.logActionAsync(authentication.getName(), "KEY_GENERATE", "RSA_KEYPAIR", 0);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Key pair generation failed: " + e.getMessage()));
        }
    }

    /**
     * Signs a file using a provided RSA private key.
     * POST /api/signature/sign
     * Multipart form: file, privateKey (Base64)
     */
    @PostMapping(value = "/sign", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> signFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("privateKey") String privateKeyBase64,
            Authentication authentication) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is required"));
            }
            if (privateKeyBase64 == null || privateKeyBase64.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Private key is required"));
            }

            byte[] fileBytes = file.getBytes();
            String signature = signatureService.signFile(fileBytes, privateKeyBase64.trim());

            Map<String, Object> response = new HashMap<>();
            response.put("signature", signature);
            response.put("fileName", file.getOriginalFilename());
            response.put("fileSize", fileBytes.length);
            response.put("algorithm", "SHA256withRSA");
            response.put("message", "File signed successfully");
            response.put("timestamp", System.currentTimeMillis());

            if (authentication != null && authentication.getName() != null) {
                auditService.logActionAsync(authentication.getName(), "FILE_SIGN", file.getOriginalFilename(), fileBytes.length);
            }

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid key format: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Signing failed: " + e.getMessage()));
        }
    }

    /**
     * Verifies a file signature using a provided RSA public key.
     * POST /api/signature/verify
     * Multipart form: file, signature (Base64), publicKey (Base64)
     */
    @PostMapping(value = "/verify", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> verifySignature(
            @RequestParam("file") MultipartFile file,
            @RequestParam("signature") String signatureBase64,
            @RequestParam("publicKey") String publicKeyBase64,
            Authentication authentication) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is required"));
            }
            if (signatureBase64 == null || signatureBase64.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Signature is required"));
            }
            if (publicKeyBase64 == null || publicKeyBase64.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Public key is required"));
            }

            byte[] fileBytes = file.getBytes();
            boolean valid = signatureService.verifySignature(fileBytes, signatureBase64.trim(), publicKeyBase64.trim());

            Map<String, Object> response = new HashMap<>();
            response.put("valid", valid);
            response.put("fileName", file.getOriginalFilename());
            response.put("message", valid ? "✅ Signature is VALID — file is authentic and unaltered."
                    : "❌ Signature is INVALID — file may have been tampered with.");
            response.put("timestamp", System.currentTimeMillis());

            if (authentication != null && authentication.getName() != null) {
                auditService.logActionAsync(authentication.getName(), "SIGNATURE_VERIFY", file.getOriginalFilename(), fileBytes.length);
            }

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid key or signature format: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Verification failed: " + e.getMessage()));
        }
    }
}
