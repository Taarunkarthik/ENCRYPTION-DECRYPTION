package com.encryption.service;

import com.encryption.dto.AuditLogDTO;
import com.encryption.util.SupabaseClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class AuditServiceTest {

    @Mock
    private SupabaseClient supabaseClient;

    @InjectMocks
    private AuditService auditService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        when(supabaseClient.isConfigured()).thenReturn(true);
    }

    @Test
    void logEncryption_Success() throws Exception {
        auditService.logEncryption("user-1", "test.txt", 100L);

        // Verify insertRecord was called (async might need a small wait or just testing the call logic if sync in test)
        // Since @Async is usually disabled or handled differently in tests, we check if the client was called.
        verify(supabaseClient, timeout(1000)).insertRecord(eq("audit_logs"), anyMap());
    }

    @Test
    void logActionAsync_Success() throws Exception {
        auditService.logActionAsync("user-1", "SIGN", "file.pdf", 200L);

        verify(supabaseClient, timeout(1000)).insertRecord(eq("audit_logs"), anyMap());
    }

    @Test
    void getAuditLogs_Success() throws Exception {
        String userId = "user-1";
        AuditLogDTO log = new AuditLogDTO("id-1", userId, "ENCRYPT", "test.txt", 100L, "2023-01-01T00:00:00Z");
        String jsonResponse = objectMapper.writeValueAsString(new AuditLogDTO[]{log});

        when(supabaseClient.queryRecords(eq("audit_logs"), anyString())).thenReturn(jsonResponse);

        List<AuditLogDTO> results = auditService.getAuditLogs(userId, false);

        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals("ENCRYPT", results.get(0).getAction());
        assertEquals(userId, results.get(0).getUserId());
    }

    @Test
    void getAuditLogs_Empty() throws Exception {
        String userId = "user-2";
        when(supabaseClient.queryRecords(eq("audit_logs"), anyString())).thenReturn("[]");

        List<AuditLogDTO> results = auditService.getAuditLogs(userId, false);

        assertNotNull(results);
        assertEquals(0, results.size());
    }
}
