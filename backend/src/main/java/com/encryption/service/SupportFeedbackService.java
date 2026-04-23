package com.encryption.service;

import com.encryption.dto.SupportFeedbackDTO;
import com.encryption.dto.SupportFeedbackRequest;
import com.encryption.util.SupabaseClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class SupportFeedbackService {

    private static final String TABLE_NAME = "support_feedback";

    private final SupabaseClient supabaseClient;
    private final ObjectMapper objectMapper;

    public SupportFeedbackService(SupabaseClient supabaseClient) {
        this.supabaseClient = supabaseClient;
        this.objectMapper = new ObjectMapper();
    }

    public String submitFeedback(String authenticatedUserId, SupportFeedbackRequest request) throws Exception {
        String feedbackId = UUID.randomUUID().toString();

        Map<String, Object> data = new HashMap<>();
        data.put("id", feedbackId);
        data.put("email", request.getEmail().trim());
        data.put("subject", request.getSubject().trim());
        data.put("message", request.getMessage().trim());
        data.put("status", "OPEN");
        data.put("created_at", Instant.now().toString());

        if ("anonymous-user".equals(authenticatedUserId) || authenticatedUserId == null || authenticatedUserId.isBlank()) {
            data.put("user_id", null);
        } else {
            data.put("user_id", authenticatedUserId);
        }

        supabaseClient.insertRecord(TABLE_NAME, data);
        return feedbackId;
    }

    public List<SupportFeedbackDTO> getAllFeedback() throws Exception {
        String filter = "select=*&order=created_at.desc";
        String response = supabaseClient.queryRecords(TABLE_NAME, filter);

        if (response == null || response.trim().isEmpty() || "null".equals(response)) {
            return new ArrayList<>();
        }

        SupportFeedbackDTO[] feedback = objectMapper.readValue(response, SupportFeedbackDTO[].class);
        return Arrays.asList(feedback);
    }
}