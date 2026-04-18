package com.encryption.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for encryption operations.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EncryptionRequest {
    private String passphrase;
    private String fileName;
}
