package com.encryption.controller;

import com.encryption.service.AuditService;
import com.encryption.service.IntegrityService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(IntegrityController.class)
@DisplayName("IntegrityController MockMvc Tests")
public class IntegrityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private IntegrityService integrityService;

    @MockBean
    private AuditService auditService;

    // ─── POST /api/integrity/hash ─────────────────────────────────────────────

    @Test
    @WithMockUser(username = "user@example.com")
    @DisplayName("POST /api/integrity/hash — valid file returns 200 with all hash algorithms")
    public void testComputeHash_validFile_returns200WithHashes() throws Exception {
        byte[] fileContent = "Sample file for hashing.".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", "sample.txt", MediaType.TEXT_PLAIN_VALUE, fileContent);

        Map<String, String> mockHashes = new LinkedHashMap<>();
        mockHashes.put("MD5",     "098f6bcd4621d373cade4e832627b4f6");
        mockHashes.put("SHA-1",   "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3");
        mockHashes.put("SHA-256", "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08");
        mockHashes.put("SHA-512", "ee26b0dd4af7e749aa1a8ee3c10ae9923f618980772e473f8819a5d4940e0db27" +
                "ac185f8a0e1d5f84f88bc887fd67b143732c304cc5fa9ad8e6f57f50028a8ff");

        when(integrityService.computeHashesStream(any(java.io.InputStream.class))).thenReturn(mockHashes);

        mockMvc.perform(multipart("/api/integrity/hash")
                        .file(file)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileName").value("sample.txt"))
                .andExpect(jsonPath("$.fileSize").value(fileContent.length))
                .andExpect(jsonPath("$.hashes.MD5").value("098f6bcd4621d373cade4e832627b4f6"))
                .andExpect(jsonPath("$.hashes['SHA-256']").value(
                        "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"))
                .andExpect(jsonPath("$.message").value("Hashes computed successfully"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @WithMockUser(username = "user@example.com")
    @DisplayName("POST /api/integrity/hash — audit log is triggered for authenticated user")
    public void testComputeHash_triggersAuditLog() throws Exception {
        byte[] fileContent = "Audit test file.".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", "audit.txt", MediaType.TEXT_PLAIN_VALUE, fileContent);

        Map<String, String> hashes = new LinkedHashMap<>();
        hashes.put("SHA-256", "abc123");
        when(integrityService.computeHashesStream(any(java.io.InputStream.class))).thenReturn(hashes);

        mockMvc.perform(multipart("/api/integrity/hash")
                        .file(file)
                        .with(csrf()))
                .andExpect(status().isOk());

        verify(auditService, times(1))
                .logActionAsync(eq("user@example.com"), eq("INTEGRITY_CHECK"), eq("audit.txt"), anyLong());
    }

    @Test
    @DisplayName("POST /api/integrity/hash — unauthenticated returns 401/403")
    public void testComputeHash_unauthenticated_returns401() throws Exception {
        byte[] fileContent = "Content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", "file.txt", MediaType.TEXT_PLAIN_VALUE, fileContent);

        mockMvc.perform(multipart("/api/integrity/hash")
                        .file(file))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @WithMockUser
    @DisplayName("POST /api/integrity/hash — service exception returns 500")
    public void testComputeHash_serviceException_returns500() throws Exception {
        byte[] fileContent = "Content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", "file.txt", MediaType.TEXT_PLAIN_VALUE, fileContent);

        when(integrityService.computeHashesStream(any(java.io.InputStream.class)))
                .thenThrow(new RuntimeException("Hash computation failed"));

        mockMvc.perform(multipart("/api/integrity/hash")
                        .file(file)
                        .with(csrf()))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value(
                        org.hamcrest.Matchers.containsString("Hash computation failed")));
    }

    @Test
    @WithMockUser
    @DisplayName("POST /api/integrity/hash — response contains timestamp")
    public void testComputeHash_responseContainsTimestamp() throws Exception {
        byte[] fileContent = "timestamped content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", "ts.txt", MediaType.TEXT_PLAIN_VALUE, fileContent);

        Map<String, String> hashes = new LinkedHashMap<>();
        hashes.put("SHA-256", "abc");
        when(integrityService.computeHashesStream(any(java.io.InputStream.class))).thenReturn(hashes);

        mockMvc.perform(multipart("/api/integrity/hash")
                        .file(file)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.timestamp").isNumber());
    }
}
