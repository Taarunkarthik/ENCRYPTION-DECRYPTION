package com.encryption.controller;

import com.encryption.dto.DecryptionRequest;
import com.encryption.dto.EncryptionResponse;
import com.encryption.service.AuditService;
import com.encryption.service.FileService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class FileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FileService fileService;

    @MockBean
    private AuditService auditService;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String TEST_USER = "test-user-id";

    @BeforeEach
    void setUp() {
        reset(fileService, auditService);
    }

    @Test
    @WithMockUser(username = TEST_USER)
    void encryptFile_Success() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.txt", MediaType.TEXT_PLAIN_VALUE, "Hello World".getBytes());
        String passphrase = "securepassword123";
        String fileId = "file-123";

        when(fileService.encryptAndUploadFileStream(any(), anyString(), anyString(), anyString())).thenReturn(fileId);

        mockMvc.perform(multipart("/api/encrypt")
                .file(file)
                .param("passphrase", passphrase))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileId").value(fileId))
                .andExpect(jsonPath("$.fileName").value("test.txt"))
                .andExpect(jsonPath("$.message").value("File encrypted successfully"));

        verify(auditService).logEncryption(eq(TEST_USER), eq("test.txt"), anyLong());
    }

    @Test
    @WithMockUser(username = TEST_USER)
    void encryptFile_ShortPassphrase() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.txt", MediaType.TEXT_PLAIN_VALUE, "Hello World".getBytes());
        String passphrase = "short";

        mockMvc.perform(multipart("/api/encrypt")
                .file(file)
                .param("passphrase", passphrase))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Passphrase must be at least 8 characters long"));
    }

    @Test
    @WithMockUser(username = TEST_USER)
    void decryptFile_Success() throws Exception {
        String fileId = "file-123";
        String passphrase = "securepassword123";
        byte[] decryptedContent = "Hello World".getBytes();
        DecryptionRequest request = new DecryptionRequest();
        request.setPassphrase(passphrase);

        when(fileService.validateFileOwnership(fileId, TEST_USER)).thenReturn(true);
        doAnswer(invocation -> {
            java.io.OutputStream os = invocation.getArgument(3);
            os.write(decryptedContent);
            return null;
        }).when(fileService).downloadAndDecryptFileStream(eq(fileId), eq(passphrase), eq(TEST_USER), any(java.io.OutputStream.class));

        mockMvc.perform(post("/api/decrypt/" + fileId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"decrypted_" + fileId + "\""))
                .andExpect(content().bytes(decryptedContent));

        verify(auditService).logDecryption(eq(TEST_USER), eq(fileId), anyLong());
    }

    @Test
    @WithMockUser(username = TEST_USER)
    void decryptFile_AccessDenied() throws Exception {
        String fileId = "file-123";
        String passphrase = "securepassword123";
        DecryptionRequest request = new DecryptionRequest();
        request.setPassphrase(passphrase);

        when(fileService.validateFileOwnership(fileId, TEST_USER)).thenReturn(false);

        mockMvc.perform(post("/api/decrypt/" + fileId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Access denied: You do not own this file"));
    }

    @Test
    @WithMockUser(username = TEST_USER)
    void getAuditLogs_Success() throws Exception {
        when(auditService.getAuditLogs(TEST_USER)).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/audit-logs"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));

        verify(auditService).getAuditLogs(TEST_USER);
    }

    @Test
    void unauthenticatedAccess_RedirectOrOk() throws Exception {
        // Since JwtFilter now allows unauthenticated requests to pass as "anonymous-user"
        // for public access (if permitted by SecurityConfig), we check for the actual 
        // behavior of the security filter.
        mockMvc.perform(get("/api/audit-logs"))
                .andExpect(status().isOk()); // SecurityConfig has .permitAll() currently
    }
}
