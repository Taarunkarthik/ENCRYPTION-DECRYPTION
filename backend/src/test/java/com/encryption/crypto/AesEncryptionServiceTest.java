package com.encryption.crypto;

import com.encryption.config.CryptoConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.io.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for AES-256-GCM encryption service.
 */
@SpringBootTest
@ActiveProfiles("test")
class AesEncryptionServiceTest {

    @Autowired
    private AesEncryptionService encryptionService;

    private String testPassphrase;
    private String testFileContent;

    @BeforeEach
    void setUp() {
        testPassphrase = "MySecurePassphrase123!";
        testFileContent = "This is test file content for encryption and decryption testing.";
    }

    @Test
    void testEncryptAndDecryptFile() throws Exception {
        // Encrypt
        ByteArrayInputStream inputStream = new ByteArrayInputStream(testFileContent.getBytes());
        byte[] encryptedData = encryptionService.encryptFile(inputStream, testPassphrase);

        assertNotNull(encryptedData);
        assertNotEquals(testFileContent, new String(encryptedData));
        assertTrue(encryptedData.length > 16); // At least IV + some data

        // Decrypt
        ByteArrayInputStream encryptedInputStream = new ByteArrayInputStream(encryptedData);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        encryptionService.decryptFile(encryptedInputStream, outputStream, testPassphrase);

        String decryptedContent = outputStream.toString();
        assertEquals(testFileContent, decryptedContent);
    }

    @Test
    void testDecryptionFailsWithWrongPassphrase() {
        // Encrypt
        ByteArrayInputStream inputStream = new ByteArrayInputStream(testFileContent.getBytes());
        byte[] encryptedData = encryptionService.encryptFile(inputStream, testPassphrase);

        // Try to decrypt with wrong passphrase
        ByteArrayInputStream encryptedInputStream = new ByteArrayInputStream(encryptedData);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        String wrongPassphrase = "WrongPassphrase123!";

        assertThrows(Exception.class, () ->
                encryptionService.decryptFile(encryptedInputStream, outputStream, wrongPassphrase)
        );
    }

    @Test
    void testEncryptionWithDifferentPassphrasesProducesDifferentResults() throws Exception {
        ByteArrayInputStream input1 = new ByteArrayInputStream(testFileContent.getBytes());
        byte[] encrypted1 = encryptionService.encryptFile(input1, "Passphrase1");

        ByteArrayInputStream input2 = new ByteArrayInputStream(testFileContent.getBytes());
        byte[] encrypted2 = encryptionService.encryptFile(input2, "Passphrase2");

        assertNotEquals(new String(encrypted1), new String(encrypted2));
    }

    @Test
    void testIVIsRandomEachTime() throws Exception {
        // Encrypt same content twice with same passphrase
        ByteArrayInputStream input1 = new ByteArrayInputStream(testFileContent.getBytes());
        byte[] encrypted1 = encryptionService.encryptFile(input1, testPassphrase);

        ByteArrayInputStream input2 = new ByteArrayInputStream(testFileContent.getBytes());
        byte[] encrypted2 = encryptionService.encryptFile(input2, testPassphrase);

        // Encrypted data should be different due to random IV
        assertNotEquals(new String(encrypted1), new String(encrypted2));
    }

    @Test
    void testLargeFileEncryption() throws Exception {
        // Create large test file (10MB)
        StringBuilder largeContent = new StringBuilder();
        for (int i = 0; i < 100000; i++) {
            largeContent.append("This is a line of test data for large file encryption. ");
        }

        ByteArrayInputStream inputStream = new ByteArrayInputStream(largeContent.toString().getBytes());
        byte[] encryptedData = encryptionService.encryptFile(inputStream, testPassphrase);

        assertNotNull(encryptedData);
        assertTrue(encryptedData.length > 1000000); // At least 1MB

        // Decrypt and verify
        ByteArrayInputStream encryptedInputStream = new ByteArrayInputStream(encryptedData);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        encryptionService.decryptFile(encryptedInputStream, outputStream, testPassphrase);

        assertEquals(largeContent.toString(), outputStream.toString());
    }
}
