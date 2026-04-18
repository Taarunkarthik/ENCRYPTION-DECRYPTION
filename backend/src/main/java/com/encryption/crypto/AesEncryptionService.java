package com.encryption.crypto;

import com.encryption.exception.EncryptionException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.*;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.Arrays;

/**
 * AES-256-GCM encryption service with PBKDF2-SHA256 key derivation.
 * Supports file encryption and decryption with streaming for large files.
 */
@Slf4j
@Service
public class AesEncryptionService {

    @Value("${encryption.algorithm:AES/GCM/NoPadding}")
    private String algorithm;

    @Value("${encryption.key-size:256}")
    private int keySize;

    @Value("${encryption.iv-size:16}")
    private int ivSize;

    @Value("${encryption.gcm-tag-length:128}")
    private int gcmTagLength;

    @Value("${encryption.pbkdf2-iterations:100000}")
    private int pbkdf2Iterations;

    private static final String KEY_ALGORITHM = "PBKDF2WithHmacSHA256";
    private static final String CIPHER_ALGORITHM = "AES";
    private static final int BUFFER_SIZE = 8192; // 8KB buffer for streaming

    /**
     * Encrypt file from input stream and return encrypted output.
     * Format: [16-byte IV][encrypted data][16-byte GCM tag]
     */
    public byte[] encryptFile(InputStream inputStream, String passphrase) throws EncryptionException {
        try {
            log.debug("Starting file encryption with passphrase length: {}", passphrase.length());
            
            // Generate random IV
            byte[] iv = generateIV();
            log.debug("Generated IV: {} bytes", iv.length);
            
            // Derive key from passphrase
            SecretKey secretKey = deriveKey(passphrase, iv);
            log.debug("Derived encryption key using PBKDF2");
            
            // Create cipher
            Cipher cipher = Cipher.getInstance(algorithm);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(gcmTagLength, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, gcmSpec);
            
            // Encrypt file with streaming
            ByteArrayOutputStream encryptedOutput = new ByteArrayOutputStream();
            byte[] buffer = new byte[BUFFER_SIZE];
            int bytesRead;
            
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                cipher.update(buffer, 0, bytesRead);
            }
            
            byte[] ciphertextWithTag = cipher.doFinal();
            log.debug("Encrypted {} bytes", ciphertextWithTag.length);
            
            // Combine IV + ciphertext + tag into single byte array
            ByteBuffer result = ByteBuffer.allocate(iv.length + ciphertextWithTag.length);
            result.put(iv);
            result.put(ciphertextWithTag);
            
            byte[] finalEncryptedData = result.array();
            log.debug("Final encrypted data size: {} bytes", finalEncryptedData.length);
            
            return finalEncryptedData;
        } catch (Exception ex) {
            log.error("Encryption failed: {}", ex.getMessage(), ex);
            throw new EncryptionException("File encryption failed: " + ex.getMessage(), ex);
        }
    }

    /**
     * Decrypt file from input stream and write to output stream.
     * Extracts IV from the first 16 bytes, then decrypts the rest.
     */
    public void decryptFile(InputStream inputStream, OutputStream outputStream, String passphrase) throws EncryptionException {
        try {
            log.debug("Starting file decryption with passphrase length: {}", passphrase.length());
            
            // Read all encrypted data
            byte[] encryptedData = inputStream.readAllBytes();
            log.debug("Read {} bytes of encrypted data", encryptedData.length);
            
            if (encryptedData.length < ivSize) {
                throw new EncryptionException("Encrypted data is too small (missing IV)");
            }
            
            // Extract IV from first 16 bytes
            byte[] iv = Arrays.copyOf(encryptedData, ivSize);
            byte[] ciphertextWithTag = Arrays.copyOfRange(encryptedData, ivSize, encryptedData.length);
            
            log.debug("Extracted IV: {} bytes, ciphertext+tag: {} bytes", iv.length, ciphertextWithTag.length);
            
            // Derive key from passphrase using same IV
            SecretKey secretKey = deriveKey(passphrase, iv);
            
            // Create cipher
            Cipher cipher = Cipher.getInstance(algorithm);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(gcmTagLength, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, gcmSpec);
            
            // Decrypt
            byte[] plaintext = cipher.doFinal(ciphertextWithTag);
            log.debug("Decrypted {} bytes", plaintext.length);
            
            // Write to output stream
            outputStream.write(plaintext);
            outputStream.flush();
            
            log.debug("File decryption completed successfully");
        } catch (javax.crypto.AEADBadTagException ex) {
            log.error("Decryption failed: GCM tag validation failed (invalid passphrase or corrupted file)");
            throw new EncryptionException("Decryption failed: Invalid passphrase or corrupted file", ex);
        } catch (Exception ex) {
            log.error("Decryption failed: {}", ex.getMessage(), ex);
            throw new EncryptionException("File decryption failed: " + ex.getMessage(), ex);
        }
    }

    /**
     * Generate a random IV (Initialization Vector).
     * Each encryption operation uses a fresh, random IV.
     */
    private byte[] generateIV() {
        byte[] iv = new byte[ivSize];
        SecureRandom random = new SecureRandom();
        random.nextBytes(iv);
        return iv;
    }

    /**
     * Derive AES key from passphrase using PBKDF2-SHA256.
     * Uses IV as salt (deterministic: same passphrase + IV = same key).
     */
    private SecretKey deriveKey(String passphrase, byte[] salt) throws EncryptionException {
        try {
            PBEKeySpec spec = new PBEKeySpec(
                    passphrase.toCharArray(),
                    salt,
                    pbkdf2Iterations,
                    keySize
            );
            
            SecretKeyFactory factory = SecretKeyFactory.getInstance(KEY_ALGORITHM);
            byte[] key = factory.generateSecret(spec).getEncoded();
            
            return new SecretKeySpec(key, 0, key.length, CIPHER_ALGORITHM);
        } catch (Exception ex) {
            log.error("Key derivation failed: {}", ex.getMessage(), ex);
            throw new EncryptionException("Key derivation failed: " + ex.getMessage(), ex);
        }
    }
}
