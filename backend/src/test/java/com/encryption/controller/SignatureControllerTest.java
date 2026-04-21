package com.encryption.controller;

import com.encryption.service.AuditService;
import com.encryption.service.SignatureService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SignatureController.class)
@DisplayName("SignatureController MockMvc Tests")
public class SignatureControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SignatureService signatureService;

    @MockBean
    private AuditService auditService;

    // ─── GET /api/signature/generate-keypair ─────────────────────────────────

    @Test
    @WithMockUser(username = "test@example.com")
    @DisplayName("GET /api/signature/generate-keypair — returns 200 with key fields")
    public void testGenerateKeyPair_authenticated_returns200() throws Exception {
        SignatureService.KeyPairResult keyPair = new SignatureService.KeyPairResult(
                "PRIVATE_KEY_BASE64", "PUBLIC_KEY_BASE64");
        when(signatureService.generateKeyPair()).thenReturn(keyPair);

        mockMvc.perform(get("/api/signature/generate-keypair").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.privateKey").value("PRIVATE_KEY_BASE64"))
                .andExpect(jsonPath("$.publicKey").value("PUBLIC_KEY_BASE64"))
                .andExpect(jsonPath("$.algorithm").value("RSA-2048"))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("GET /api/signature/generate-keypair — unauthenticated returns 401/403")
    public void testGenerateKeyPair_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/signature/generate-keypair"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    @DisplayName("GET /api/signature/generate-keypair — service exception returns 500")
    public void testGenerateKeyPair_serviceException_returns500() throws Exception {
        when(signatureService.generateKeyPair()).thenThrow(new RuntimeException("Key generation failed"));

        mockMvc.perform(get("/api/signature/generate-keypair").with(csrf()))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").exists());
    }

    // ─── POST /api/signature/sign ─────────────────────────────────────────────

    @Test
    @WithMockUser(username = "test@example.com")
    @DisplayName("POST /api/signature/sign — valid file and key returns 200 with signature")
    public void testSignFile_validInput_returns200() throws Exception {
        byte[] fileContent = "Content to be signed.".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.txt", MediaType.TEXT_PLAIN_VALUE, fileContent);

        when(signatureService.signFileStream(any(java.io.InputStream.class), anyString()))
                .thenReturn("BASE64_SIGNATURE_VALUE");
        when(signatureService.createSignedFile(any(byte[].class), anyString()))
                .thenReturn("SIGNED_FILE_CONTENT".getBytes());

        mockMvc.perform(multipart("/api/signature/sign")
                        .file(file)
                        .param("privateKey", "VALID_PRIVATE_KEY_BASE64")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.signature").value("BASE64_SIGNATURE_VALUE"))
                .andExpect(jsonPath("$.fileName").value("test.txt"))
                .andExpect(jsonPath("$.algorithm").value("SHA256withRSA"))
                .andExpect(jsonPath("$.message").value("File signed successfully"));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    @DisplayName("POST /api/signature/sign — missing private key returns 400")
    public void testSignFile_missingPrivateKey_returns400() throws Exception {
        byte[] fileContent = "Content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.txt", MediaType.TEXT_PLAIN_VALUE, fileContent);

        mockMvc.perform(multipart("/api/signature/sign")
                        .file(file)
                        .param("privateKey", "  ")
                        .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    @DisplayName("POST /api/signature/sign — service exception returns 500")
    public void testSignFile_serviceException_returns500() throws Exception {
        byte[] fileContent = "Content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.txt", MediaType.TEXT_PLAIN_VALUE, fileContent);

        when(signatureService.signFileStream(any(java.io.InputStream.class), anyString()))
                .thenThrow(new RuntimeException("Signing failure"));

        mockMvc.perform(multipart("/api/signature/sign")
                        .file(file)
                        .param("privateKey", "SOME_KEY")
                        .with(csrf()))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    @DisplayName("POST /api/signature/sign — invalid key format returns 400")
    public void testSignFile_invalidKeyFormat_returns400() throws Exception {
        byte[] fileContent = "Content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.txt", MediaType.TEXT_PLAIN_VALUE, fileContent);

        when(signatureService.signFileStream(any(java.io.InputStream.class), anyString()))
                .thenThrow(new IllegalArgumentException("Bad key format"));

        mockMvc.perform(multipart("/api/signature/sign")
                        .file(file)
                        .param("privateKey", "BAD_KEY")
                        .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("Invalid key format")));
    }

    // ─── POST /api/signature/verify ───────────────────────────────────────────

    @Test
    @WithMockUser(username = "test@example.com")
    @DisplayName("POST /api/signature/verify — valid signature returns 200 with valid=true")
    public void testVerifySignature_validSignature_returns200True() throws Exception {
        byte[] fileContent = "Authentic content.".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", "doc.pdf", MediaType.APPLICATION_OCTET_STREAM_VALUE, fileContent);

        when(signatureService.verifySignatureStream(any(java.io.InputStream.class), anyString(), anyString()))
                .thenReturn(true);

        mockMvc.perform(multipart("/api/signature/verify")
                        .file(file)
                        .param("signature", "VALID_SIG_BASE64")
                        .param("publicKey", "VALID_PUB_KEY_BASE64")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(true))
                .andExpect(jsonPath("$.message").value(
                        org.hamcrest.Matchers.containsString("VALID")));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    @DisplayName("POST /api/signature/verify — tampered file returns 200 with valid=false")
    public void testVerifySignature_tamperedFile_returns200False() throws Exception {
        byte[] fileContent = "Tampered content.".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", "tampered.txt", MediaType.TEXT_PLAIN_VALUE, fileContent);

        when(signatureService.verifySignatureStream(any(java.io.InputStream.class), anyString(), anyString()))
                .thenReturn(false);

        mockMvc.perform(multipart("/api/signature/verify")
                        .file(file)
                        .param("signature", "SOME_SIG_BASE64")
                        .param("publicKey", "SOME_PUB_KEY_BASE64")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(false))
                .andExpect(jsonPath("$.message").value(
                        org.hamcrest.Matchers.containsString("INVALID")));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    @DisplayName("POST /api/signature/verify — missing signature returns 400")
    public void testVerifySignature_missingSignature_returns400() throws Exception {
        byte[] fileContent = "Content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", "doc.txt", MediaType.TEXT_PLAIN_VALUE, fileContent);

        mockMvc.perform(multipart("/api/signature/verify")
                        .file(file)
                        .param("signature", " ")
                        .param("publicKey", "SOME_KEY")
                        .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    @DisplayName("POST /api/signature/verify — missing public key returns 400")
    public void testVerifySignature_missingPublicKey_returns400() throws Exception {
        byte[] fileContent = "Content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", "doc.txt", MediaType.TEXT_PLAIN_VALUE, fileContent);

        mockMvc.perform(multipart("/api/signature/verify")
                        .file(file)
                        .param("signature", "SOME_SIG")
                        .param("publicKey", " ")
                        .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }
}
