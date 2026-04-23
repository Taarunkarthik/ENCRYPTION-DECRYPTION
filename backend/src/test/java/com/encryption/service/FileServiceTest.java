package com.encryption.service;

import com.encryption.crypto.AesEncryptionService;
import com.encryption.crypto.EncryptedOutput;
import com.encryption.util.SupabaseClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DisplayName("FileService Tests")
@ExtendWith(MockitoExtension.class)
public class FileServiceTest {

    @Mock
    private SupabaseClient supabaseClient;

    private AesEncryptionService aesEncryptionService;
    private FileService fileService;

    @BeforeEach
    public void setUp() {
        aesEncryptionService = new AesEncryptionService();
        ReflectionTestUtils.setField(aesEncryptionService, "keyDerivationAlgorithm", "PBKDF2WithHmacSHA256");
        ReflectionTestUtils.setField(aesEncryptionService, "pbkdf2Iterations", 100000);
        ReflectionTestUtils.setField(aesEncryptionService, "saltLength", 16);
        ReflectionTestUtils.setField(aesEncryptionService, "ivLength", 16);
        ReflectionTestUtils.setField(aesEncryptionService, "tagLength", 128);

        fileService = new FileService(aesEncryptionService, supabaseClient);
    }

    // ─── encryptAndUploadFile ─────────────────────────────────────────────────

    @Test
    @DisplayName("Encrypt and upload — returns non-null file ID")
    public void testEncryptAndUpload_returnsFileId() throws Exception {
        byte[] content = "Secret document content.".getBytes();

        doNothing().when(supabaseClient).uploadFile(anyString(), anyString(), any(byte[].class));

        String fileId = fileService.encryptAndUploadFile(content, "doc.txt", "StrongPass123!", "user-001");

        assertNotNull(fileId, "File ID should not be null");
        assertTrue(fileId.startsWith("encrypted_"), "File ID should start with 'encrypted_'");
        assertTrue(fileId.endsWith(".bin"), "File ID should end with '.bin'");
    }

    @Test
    @DisplayName("Encrypt and upload — unique file IDs per call")
    public void testEncryptAndUpload_uniqueFileIds() throws Exception {
        byte[] content = "Test content".getBytes();

        doNothing().when(supabaseClient).uploadFile(anyString(), anyString(), any(byte[].class));

        String fileId1 = fileService.encryptAndUploadFile(content, "f1.txt", "Passphrase123!", "user-001");
        String fileId2 = fileService.encryptAndUploadFile(content, "f2.txt", "Passphrase123!", "user-001");

        assertNotEquals(fileId1, fileId2, "Each encryption should generate a unique file ID");
    }

    @Test
    @DisplayName("Encrypt and upload — preserves safe source extension in file ID")
    public void testEncryptAndUpload_preservesExtensionInFileId() throws Exception {
        byte[] content = "Binary office content".getBytes();

        doNothing().when(supabaseClient).uploadFile(anyString(), anyString(), any(byte[].class));

        String pdfFileId = fileService.encryptAndUploadFile(content, "slides.pdf", "Passphrase123!", "user-001");
        String docxFileId = fileService.encryptAndUploadFile(content, "report.docx", "Passphrase123!", "user-001");
        String pptxFileId = fileService.encryptAndUploadFile(content, "deck.pptx", "Passphrase123!", "user-001");

        assertTrue(pdfFileId.matches("encrypted_[0-9a-fA-F-]{36}\\.pdf\\.bin"));
        assertTrue(docxFileId.matches("encrypted_[0-9a-fA-F-]{36}\\.docx\\.bin"));
        assertTrue(pptxFileId.matches("encrypted_[0-9a-fA-F-]{36}\\.pptx\\.bin"));
    }

    @Test
    @DisplayName("Encrypt and upload — Supabase uploadFile is called once")
    public void testEncryptAndUpload_callsSupabaseUpload() throws Exception {
        byte[] content = "Upload verification content.".getBytes();

        doNothing().when(supabaseClient).uploadFile(anyString(), anyString(), any(byte[].class));

        fileService.encryptAndUploadFile(content, "test.txt", "ValidPass123!", "user-007");

        verify(supabaseClient, times(1))
                .uploadFile(eq("encrypted_bucket"), anyString(), any(byte[].class));
    }

    @Test
    @DisplayName("Encrypt and upload — short passphrase throws IllegalArgumentException")
    public void testEncryptAndUpload_shortPassphrase_throws() {
        byte[] content = "Some content".getBytes();

        assertThrows(IllegalArgumentException.class, () ->
                fileService.encryptAndUploadFile(content, "file.txt", "short", "user-001"),
                "Short passphrase must be rejected");
    }

    @Test
    @DisplayName("Encrypt and upload — null passphrase throws IllegalArgumentException")
    public void testEncryptAndUpload_nullPassphrase_throws() {
        byte[] content = "Some content".getBytes();

        assertThrows(IllegalArgumentException.class, () ->
                fileService.encryptAndUploadFile(content, "file.txt", null, "user-001"),
                "Null passphrase must be rejected");
    }

    // ─── downloadAndDecryptFile ───────────────────────────────────────────────

    @Test
    @DisplayName("Download and decrypt — restores original plaintext")
    public void testDownloadAndDecrypt_restoresPlaintext() throws Exception {
        String passphrase = "StrongPassphrase123!";
        byte[] originalContent = "Confidential file content for round-trip test.".getBytes();

        // 1. Encrypt directly to produce what would be stored in Supabase
        EncryptedOutput encrypted = aesEncryptionService.encrypt(originalContent, passphrase);
        byte[] storedBytes = encrypted.toByteArray();

        // 2. Mock Supabase to return those stored bytes
        when(supabaseClient.downloadFile(eq("encrypted_bucket"), anyString()))
                .thenReturn(storedBytes);

        // 3. Decrypt via service
        byte[] decrypted = fileService.downloadAndDecryptFile("encrypted_someid.bin", passphrase, "user-001");

        assertArrayEquals(originalContent, decrypted, "Decrypted content must equal original");
    }

    @Test
    @DisplayName("Download and decrypt — wrong passphrase throws exception")
    public void testDownloadAndDecrypt_wrongPassphrase_throws() throws Exception {
        String correctPassphrase = "CorrectPassphrase123!";
        String wrongPassphrase   = "WrongPassphrase456!";
        byte[] originalContent   = "Private data.".getBytes();

        EncryptedOutput encrypted = aesEncryptionService.encrypt(originalContent, correctPassphrase);
        byte[] storedBytes = encrypted.toByteArray();

        when(supabaseClient.downloadFile(anyString(), anyString())).thenReturn(storedBytes);

        assertThrows(Exception.class, () ->
                fileService.downloadAndDecryptFile("some-file.bin", wrongPassphrase, "user-001"),
                "Wrong passphrase should cause decryption to fail");
    }

    @Test
    @DisplayName("Download and decrypt — file not found (null from Supabase) throws IllegalArgumentException")
    public void testDownloadAndDecrypt_fileNotFound_throws() throws Exception {
        when(supabaseClient.downloadFile(anyString(), anyString())).thenReturn(null);

        assertThrows(IllegalArgumentException.class, () ->
                fileService.downloadAndDecryptFile("nonexistent.bin", "Passphrase123!", "user-001"),
                "Missing file should throw IllegalArgumentException");
    }

    @Test
    @DisplayName("Download and decrypt — too-short payload (< 48 bytes) throws IllegalArgumentException")
    public void testDownloadAndDecrypt_tooShortPayload_throws() throws Exception {
        // Anything shorter than IV(16) + Salt(16) + GCMTag(16) = 48 bytes is invalid
        byte[] tooShort = new byte[10];
        when(supabaseClient.downloadFile(anyString(), anyString())).thenReturn(tooShort);

        assertThrows(IllegalArgumentException.class, () ->
                fileService.downloadAndDecryptFile("corrupt.bin", "Passphrase123!", "user-001"),
                "Payload shorter than 48 bytes should be rejected");
    }

    // ─── validateFileSize ─────────────────────────────────────────────────────

    @Test
    @DisplayName("validateFileSize — accepts file within limit")
    public void testValidateFileSize_withinLimit() {
        byte[] content = new byte[1024]; // 1 KB

        assertDoesNotThrow(() ->
                fileService.validateFileSize(content, 10 * 1024 * 1024L),
                "File within size limit should not throw");
    }

    @Test
    @DisplayName("validateFileSize — rejects file exceeding limit")
    public void testValidateFileSize_exceedsLimit() {
        byte[] content = new byte[11 * 1024 * 1024]; // 11 MB

        assertThrows(IllegalArgumentException.class, () ->
                fileService.validateFileSize(content, 10 * 1024 * 1024L),
                "File exceeding size limit should throw");
    }

    @Test
    @DisplayName("validateFileSize — exact limit boundary is accepted")
    public void testValidateFileSize_exactLimit() {
        byte[] content = new byte[1024];

        assertDoesNotThrow(() ->
                fileService.validateFileSize(content, 1024L),
                "File of exactly the max size should be accepted");
    }

    // ─── validateFileOwnership ────────────────────────────────────────────────

    @Test
    @DisplayName("validateFileOwnership — currently returns true (stub)")
    public void testValidateFileOwnership_returnsTrue() {
        // Ownership validation is a stub — verify the expected stub behaviour
        assertTrue(fileService.validateFileOwnership("any-file-id", "any-user-id"),
                "Ownership stub should return true");
    }
}
