package com.encryption.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class AuditLogDTO {
    
    @JsonProperty("id")
    private String id;
    
    @JsonProperty("user_id")
    private String userId;
    
    @JsonProperty("action")
    private String action;
    
    @JsonProperty("file_name")
    private String fileName;
    
    @JsonProperty("file_size_bytes")
    private long fileSizeBytes;
    
    @JsonProperty("created_at")
    private String createdAt;

    @JsonProperty("profiles")
    private ProfileDTO profiles;

    public AuditLogDTO() {}

    public AuditLogDTO(String id, String userId, String action, String fileName, long fileSizeBytes, String createdAt) {
        this.id = id;
        this.userId = userId;
        this.action = action;
        this.fileName = fileName;
        this.fileSizeBytes = fileSizeBytes;
        this.createdAt = createdAt;
    }

    public ProfileDTO getProfiles() {
        return profiles;
    }

    public void setProfiles(ProfileDTO profiles) {
        this.profiles = profiles;
    }

    public static class ProfileDTO {
        @JsonProperty("email")
        private String email;

        public ProfileDTO() {}
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public long getFileSizeBytes() {
        return fileSizeBytes;
    }

    public void setFileSizeBytes(long fileSizeBytes) {
        this.fileSizeBytes = fileSizeBytes;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
