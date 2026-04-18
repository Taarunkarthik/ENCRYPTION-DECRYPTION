package com.encryption.crypto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

/**
 * Model to represent encrypted file output.
 * Contains IV, ciphertext, and GCM authentication tag.
 */
@Data
@AllArgsConstructor
@Builder
public class EncryptedOutput {
    private byte[] iv;
    private byte[] ciphertext;
    private byte[] encryptedData; // IV + ciphertext + GCM tag combined
    private int tagLength;
}
