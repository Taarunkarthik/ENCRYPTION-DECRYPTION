package com.encryption.service;

import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.Security;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class IntegrityService {

    static {
        Security.addProvider(new BouncyCastleProvider());
    }

    private static final String[] ALGORITHMS = {"MD5", "SHA-1", "SHA-256", "SHA-512"};

    /**
     * Computes multiple cryptographic hashes for the given file bytes.
     * Returns a map of algorithm name -> hex-encoded hash.
     */
    public Map<String, String> computeHashes(byte[] fileBytes) throws Exception {
        Map<String, String> hashes = new LinkedHashMap<>();
        for (String algorithm : ALGORITHMS) {
            hashes.put(algorithm, computeHash(fileBytes, algorithm));
        }
        return hashes;
    }

    /**
     * Computes a single hash for the given algorithm.
     */
    public String computeHash(byte[] fileBytes, String algorithm) throws Exception {
        MessageDigest digest = MessageDigest.getInstance(algorithm, "BC");
        byte[] hashBytes = digest.digest(fileBytes);
        return bytesToHex(hashBytes);
    }

    /**
     * Converts a byte array to a hex string.
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
