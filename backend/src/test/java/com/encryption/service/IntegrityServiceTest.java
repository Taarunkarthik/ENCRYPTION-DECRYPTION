package com.encryption.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("IntegrityService Tests")
public class IntegrityServiceTest {

    private IntegrityService integrityService;

    @BeforeEach
    public void setUp() {
        integrityService = new IntegrityService();
    }

    // ─── computeHashes (all algorithms) ───────────────────────────────────────

    @Test
    @DisplayName("computeHashes — returns map with all four algorithms")
    public void testComputeHashes_returnsAllAlgorithms() throws Exception {
        byte[] content = "Sample file content for hashing.".getBytes();

        Map<String, String> hashes = integrityService.computeHashes(content);

        assertNotNull(hashes, "Result map should not be null");
        assertTrue(hashes.containsKey("MD5"),     "Result must contain MD5");
        assertTrue(hashes.containsKey("SHA-1"),   "Result must contain SHA-1");
        assertTrue(hashes.containsKey("SHA-256"), "Result must contain SHA-256");
        assertTrue(hashes.containsKey("SHA-512"), "Result must contain SHA-512");
    }

    @Test
    @DisplayName("computeHashes — all hash values are non-empty hex strings")
    public void testComputeHashes_nonEmptyHexValues() throws Exception {
        byte[] content = "test".getBytes();

        Map<String, String> hashes = integrityService.computeHashes(content);

        for (Map.Entry<String, String> entry : hashes.entrySet()) {
            String value = entry.getValue();
            assertNotNull(value, entry.getKey() + " hash should not be null");
            assertFalse(value.isBlank(), entry.getKey() + " hash should not be blank");
            // All hex chars
            assertTrue(value.matches("[0-9a-f]+"),
                    entry.getKey() + " hash should be lowercase hex: " + value);
        }
    }

    @Test
    @DisplayName("computeHashes — correct MD5 length (32 hex chars)")
    public void testComputeHashes_md5Length() throws Exception {
        byte[] content = "md5 test".getBytes();
        Map<String, String> hashes = integrityService.computeHashes(content);
        assertEquals(32, hashes.get("MD5").length(), "MD5 hex string should be 32 characters");
    }

    @Test
    @DisplayName("computeHashes — correct SHA-1 length (40 hex chars)")
    public void testComputeHashes_sha1Length() throws Exception {
        byte[] content = "sha1 test".getBytes();
        Map<String, String> hashes = integrityService.computeHashes(content);
        assertEquals(40, hashes.get("SHA-1").length(), "SHA-1 hex string should be 40 characters");
    }

    @Test
    @DisplayName("computeHashes — correct SHA-256 length (64 hex chars)")
    public void testComputeHashes_sha256Length() throws Exception {
        byte[] content = "sha256 test".getBytes();
        Map<String, String> hashes = integrityService.computeHashes(content);
        assertEquals(64, hashes.get("SHA-256").length(), "SHA-256 hex string should be 64 characters");
    }

    @Test
    @DisplayName("computeHashes — correct SHA-512 length (128 hex chars)")
    public void testComputeHashes_sha512Length() throws Exception {
        byte[] content = "sha512 test".getBytes();
        Map<String, String> hashes = integrityService.computeHashes(content);
        assertEquals(128, hashes.get("SHA-512").length(), "SHA-512 hex string should be 128 characters");
    }

    @Test
    @DisplayName("computeHashes — deterministic for identical input")
    public void testComputeHashes_deterministic() throws Exception {
        byte[] content = "Determinism test content".getBytes();

        Map<String, String> hashes1 = integrityService.computeHashes(content);
        Map<String, String> hashes2 = integrityService.computeHashes(content);

        assertEquals(hashes1, hashes2, "Hashes must be identical for the same content");
    }

    @Test
    @DisplayName("computeHashes — different input produces different hashes")
    public void testComputeHashes_differentForDifferentInput() throws Exception {
        byte[] content1 = "Original content".getBytes();
        byte[] content2 = "Modified content".getBytes();

        Map<String, String> hashes1 = integrityService.computeHashes(content1);
        Map<String, String> hashes2 = integrityService.computeHashes(content2);

        assertNotEquals(hashes1.get("SHA-256"), hashes2.get("SHA-256"),
                "Different inputs must produce different SHA-256 hashes");
        assertNotEquals(hashes1.get("SHA-512"), hashes2.get("SHA-512"),
                "Different inputs must produce different SHA-512 hashes");
    }

    @Test
    @DisplayName("computeHashes — empty byte array succeeds")
    public void testComputeHashes_emptyInput() throws Exception {
        byte[] empty = new byte[0];

        Map<String, String> hashes = integrityService.computeHashes(empty);

        // Known SHA-256 of empty string
        assertEquals(
                "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                hashes.get("SHA-256"),
                "SHA-256 of empty input must match known value");
    }

    // ─── computeHash (single algorithm) ───────────────────────────────────────

    @Test
    @DisplayName("computeHash SHA-256 — correct known value for 'abc'")
    public void testComputeHash_sha256Abc() throws Exception {
        byte[] input = {(byte)'a', (byte)'b', (byte)'c'};
        String hash = integrityService.computeHash(input, "SHA-256");
        assertEquals("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", hash);
    }

    @Test
    @DisplayName("computeHash MD5 — correct known value for 'abc'")
    public void testComputeHash_md5Abc() throws Exception {
        String hash = integrityService.computeHash("abc".getBytes(), "MD5");
        assertEquals("900150983cd24fb0d6963f7d28e17f72", hash);
    }

    @Test
    @DisplayName("computeHash SHA-1 — correct known value for 'abc'")
    public void testComputeHash_sha1Abc() throws Exception {
        String hash = integrityService.computeHash("abc".getBytes(), "SHA-1");
        assertEquals("a9993e364706816aba3e25717850c26c9cd0d89d", hash);
    }

    @Test
    @DisplayName("computeHash — invalid algorithm throws NoSuchAlgorithmException")
    public void testComputeHash_invalidAlgorithm_throwsException() {
        byte[] content = "test".getBytes();

        assertThrows(Exception.class, () ->
                integrityService.computeHash(content, "NONEXISTENT-ALGO"),
                "Invalid algorithm should throw an exception");
    }

    // ─── Integrity comparison scenario ────────────────────────────────────────

    @Test
    @DisplayName("Integrity check — detect single-byte change in file")
    public void testIntegrityCheck_detectsSingleByteChange() throws Exception {
        byte[] original = "Sensitive document content.".getBytes();
        byte[] modified  = original.clone();
        modified[0] = (byte) (modified[0] ^ 0xFF); // flip all bits of first byte

        String hashOriginal = integrityService.computeHash(original, "SHA-256");
        String hashModified  = integrityService.computeHash(modified, "SHA-256");

        assertNotEquals(hashOriginal, hashModified,
                "A single-byte change must produce a different hash");
    }

    @Test
    @DisplayName("computeHashes — large binary file (10 MB) completes successfully")
    public void testComputeHashes_largeFile() throws Exception {
        byte[] largeContent = new byte[10 * 1024 * 1024]; // 10 MB
        for (int i = 0; i < largeContent.length; i++) {
            largeContent[i] = (byte) (i % 256);
        }

        Map<String, String> hashes = integrityService.computeHashes(largeContent);

        assertNotNull(hashes);
        assertEquals(4, hashes.size(), "Should return 4 hash algorithms");
        assertEquals(64, hashes.get("SHA-256").length());
        assertEquals(128, hashes.get("SHA-512").length());
    }
}
