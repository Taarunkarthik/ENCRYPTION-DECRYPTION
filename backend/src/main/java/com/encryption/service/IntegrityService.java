package com.encryption.service;

import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.security.MessageDigest;
import java.security.Security;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class IntegrityService {


    private static final String[] ALGORITHMS = {"MD5", "SHA-1", "SHA-256", "SHA-512"};

    /**
     * Computes multiple cryptographic hashes for the given byte array.
     */
    public Map<String, String> computeHashes(byte[] fileBytes) throws Exception {
        try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(fileBytes)) {
            return computeHashesStream(bais);
        }
    }

    /**
     * Computes a single hash for the given byte array.
     */
    public String computeHash(byte[] fileBytes, String algorithm) throws Exception {
        try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(fileBytes)) {
            return computeHashStream(bais, algorithm);
        }
    }

    /**
     * Computes multiple cryptographic hashes for the given file stream.
     * Returns a map of algorithm name -> hex-encoded hash.
     */
    public Map<String, String> computeHashesStream(InputStream inputStream) throws Exception {
        Map<String, String> hashes = new LinkedHashMap<>();
        
        MessageDigest[] digests = new MessageDigest[ALGORITHMS.length];
        for (int i = 0; i < ALGORITHMS.length; i++) {
            digests[i] = MessageDigest.getInstance(ALGORITHMS[i]);
        }

        byte[] buffer = new byte[8192];
        int bytesRead;
        while ((bytesRead = inputStream.read(buffer)) != -1) {
            for (MessageDigest digest : digests) {
                digest.update(buffer, 0, bytesRead);
            }
        }

        for (int i = 0; i < ALGORITHMS.length; i++) {
            hashes.put(ALGORITHMS[i], bytesToHex(digests[i].digest()));
        }
        
        return hashes;
    }

    /**
     * Computes a single hash for the given algorithm from a stream.
     */
    public String computeHashStream(InputStream inputStream, String algorithm) throws Exception {
        MessageDigest digest = MessageDigest.getInstance(algorithm);
        byte[] buffer = new byte[8192];
        int bytesRead;
        while ((bytesRead = inputStream.read(buffer)) != -1) {
            digest.update(buffer, 0, bytesRead);
        }
        return bytesToHex(digest.digest());
    }

    /**
     * Converts a byte array to a hex string.
     */
    private String bytesToHex(byte[] bytes) {
        return org.bouncycastle.util.encoders.Hex.toHexString(bytes);
    }
}

