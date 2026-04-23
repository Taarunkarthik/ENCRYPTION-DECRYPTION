package com.encryption.controller;

import com.encryption.dto.SupportFeedbackRequest;
import com.encryption.service.SupportFeedbackService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class SupportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SupportFeedbackService supportFeedbackService;

    @BeforeEach
    void setUp() {
        reset(supportFeedbackService);
    }

    @Test
    @WithMockUser(username = "test-user")
    void submitFeedback_Success() throws Exception {
        SupportFeedbackRequest request = new SupportFeedbackRequest(
            "user@example.com",
            "Need help",
            "Please assist with decryption issue"
        );

        when(supportFeedbackService.submitFeedback(eq("test-user"), any(SupportFeedbackRequest.class)))
            .thenReturn("feedback-123");

        mockMvc.perform(post("/api/support")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Feedback submitted successfully"))
            .andExpect(jsonPath("$.feedbackId").value("feedback-123"));

        verify(supportFeedbackService).submitFeedback(eq("test-user"), any(SupportFeedbackRequest.class));
    }

    @Test
    void submitFeedback_AnonymousSuccess() throws Exception {
        SupportFeedbackRequest request = new SupportFeedbackRequest(
            "guest@example.com",
            "Guest issue",
            "I found a bug"
        );

        when(supportFeedbackService.submitFeedback(eq("anonymous-user"), any(SupportFeedbackRequest.class)))
            .thenReturn("feedback-guest");

        mockMvc.perform(post("/api/support")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.feedbackId").value("feedback-guest"));
    }

    @Test
    void submitFeedback_ValidationFailure() throws Exception {
        String invalidRequest = """
            {
              "email": "not-an-email",
              "subject": "",
              "message": ""
            }
            """;

        mockMvc.perform(post("/api/support")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidRequest))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").exists());
    }
}