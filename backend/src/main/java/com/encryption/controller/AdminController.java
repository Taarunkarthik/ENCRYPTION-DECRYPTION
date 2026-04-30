package com.encryption.controller;

import com.encryption.dto.SupportFeedbackDTO;
import com.encryption.dto.SupportFeedbackStatusUpdateRequest;
import com.encryption.service.SupportFeedbackService;
import com.encryption.util.SupabaseClient;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    private final SupabaseClient supabaseClient;
    private final SupportFeedbackService supportFeedbackService;

    public AdminController(SupabaseClient supabaseClient, SupportFeedbackService supportFeedbackService) {
        this.supabaseClient = supabaseClient;
        this.supportFeedbackService = supportFeedbackService;
    }

    @GetMapping("/feedback")
    public ResponseEntity<?> getSupportFeedback() {
        try {
            List<SupportFeedbackDTO> feedback = supportFeedbackService.getAllFeedback();
            return ResponseEntity.ok(feedback);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to retrieve feedback: " + e.getMessage()));
        }
    }

    @PatchMapping("/feedback/{feedbackId}/status")
    public ResponseEntity<?> updateSupportFeedbackStatus(
        @PathVariable String feedbackId,
        @Valid @RequestBody SupportFeedbackStatusUpdateRequest request
    ) {
        try {
            String updatedStatus = supportFeedbackService.updateFeedbackStatus(feedbackId, request.getStatus());
            return ResponseEntity.ok(Map.of(
                "message", "Feedback status updated successfully",
                "status", updatedStatus
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update feedback status: " + e.getMessage()));
        }
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable String userId) {
        try {
            // Delete from auth.users (requires service role)
            supabaseClient.deleteUser(userId);
            
            // Delete from public.profiles (if not already handled by CASCADE)
            // If the foreign key in profiles is set to ON DELETE CASCADE, this is automatic
            
            return ResponseEntity.ok().body(Map.of("message", "User deleted successfully"));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete user: " + e.getMessage()));
        }
    }

    @GetMapping("/status")
    public ResponseEntity<?> getInfrastructureStatus() {
        String url = supabaseClient.getSupabaseUrl();
        String maskedUrl = (url != null && url.length() > 10) 
            ? url.substring(0, 10) + "..." + url.substring(url.length() - 5)
            : "NOT_SET";
            
        return ResponseEntity.ok(Map.of(
            "configured", supabaseClient.isConfigured(),
            "status", "OPERATIONAL",
            "module", "VAULT_BACKEND",
            "endpoint_check", maskedUrl
        ));
    }
}
