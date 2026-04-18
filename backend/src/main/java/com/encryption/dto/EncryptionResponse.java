package com.encryption.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for encryption operations.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EncryptionResponse {
    private String fileId;
    private String fileName;
    private Long fileSizeBytes;
    private String message;
    private Long timestamp;
}
