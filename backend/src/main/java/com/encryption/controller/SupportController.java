package com.encryption.controller;

import com.encryption.dto.SupportFeedbackRequest;
import com.encryption.service.SupportFeedbackService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/support")
@CrossOrigin(origins = "*")
public class SupportController {

    private final SupportFeedbackService supportFeedbackService;

    public SupportController(SupportFeedbackService supportFeedbackService) {
        this.supportFeedbackService = supportFeedbackService;
    }

    @PostMapping
    public ResponseEntity<?> submitFeedback(@Valid @RequestBody SupportFeedbackRequest request, Authentication authentication) {
        try {
            String userId = (authentication != null) ? authentication.getName() : "anonymous-user";
            String feedbackId = supportFeedbackService.submitFeedback(userId, request);

            return ResponseEntity.ok(Map.of(
                "message", "Feedback submitted successfully",
                "feedbackId", feedbackId
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to submit feedback: " + e.getMessage()));
        }
    }
}