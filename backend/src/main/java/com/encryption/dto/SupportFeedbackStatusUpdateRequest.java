package com.encryption.dto;

import jakarta.validation.constraints.NotBlank;

public class SupportFeedbackStatusUpdateRequest {

    @NotBlank(message = "Status is required")
    private String status;

    public SupportFeedbackStatusUpdateRequest() {
    }

    public SupportFeedbackStatusUpdateRequest(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}