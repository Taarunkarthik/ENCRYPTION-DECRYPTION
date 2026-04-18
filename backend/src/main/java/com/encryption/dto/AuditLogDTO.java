package com.encryption.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for audit log entries.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogDTO {
    private String id;
    private String userId;
    private String action;
    private String fileName;
    private Long fileSizeBytes;
    private LocalDateTime createdAt;
}
