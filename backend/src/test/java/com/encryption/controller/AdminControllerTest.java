package com.encryption.controller;

import com.encryption.dto.SupportFeedbackDTO;
import com.encryption.service.SupportFeedbackService;
import com.encryption.util.SupabaseClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SupabaseClient supabaseClient;

    @MockBean
    private SupportFeedbackService supportFeedbackService;

    @BeforeEach
    void setUp() {
        reset(supportFeedbackService, supabaseClient);
    }

    @Test
    void getSupportFeedback_Success() throws Exception {
        SupportFeedbackDTO entry = new SupportFeedbackDTO(
            "fb-1",
            "user-1",
            "user@example.com",
            "Help",
            "Please check my issue",
            "OPEN",
            "2026-04-23T10:00:00Z"
        );

        when(supportFeedbackService.getAllFeedback()).thenReturn(List.of(entry));

        mockMvc.perform(get("/api/admin/feedback"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$[0].id").value("fb-1"))
            .andExpect(jsonPath("$[0].email").value("user@example.com"));
    }

    @Test
    void getSupportFeedback_Failure() throws Exception {
        when(supportFeedbackService.getAllFeedback()).thenThrow(new RuntimeException("db unavailable"));

        mockMvc.perform(get("/api/admin/feedback"))
            .andExpect(status().isInternalServerError())
            .andExpect(jsonPath("$.error").value("Failed to retrieve feedback: db unavailable"));
    }

    @Test
    void updateSupportFeedbackStatus_Success() throws Exception {
        when(supportFeedbackService.updateFeedbackStatus("fb-1", "resolved")).thenReturn("RESOLVED");

        mockMvc.perform(patch("/api/admin/feedback/fb-1/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"resolved\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Feedback status updated successfully"))
            .andExpect(jsonPath("$.status").value("RESOLVED"));

        verify(supportFeedbackService).updateFeedbackStatus("fb-1", "resolved");
    }

    @Test
    void updateSupportFeedbackStatus_InvalidStatus() throws Exception {
        when(supportFeedbackService.updateFeedbackStatus("fb-1", "invalid"))
            .thenThrow(new IllegalArgumentException("Invalid status. Allowed values: OPEN, IN_PROGRESS, RESOLVED"));

        mockMvc.perform(patch("/api/admin/feedback/fb-1/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"invalid\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("Invalid status. Allowed values: OPEN, IN_PROGRESS, RESOLVED"));
    }
}