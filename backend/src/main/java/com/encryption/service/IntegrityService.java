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

    static {
        Security.addProvider(new BouncyCastleProvider());
    }

    private static final String[] ALGORITHMS = {"MD5", "SHA-1", "SHA-256", "SHA-512"};

    /**
     * Computes multiple cryptographic hashes for the given file stream.
     * Returns a map of algorithm name -> hex-encoded hash.
     */
    public Map<String, String> computeHashesStream(InputStream inputStream) throws Exception {
        Map<String, String> hashes = new LinkedHashMap<>();
        
        // We need to read the stream multiple times or use a DigestInputStream.
        // For simplicity and to avoid multiple reads (which might not be possible for some streams),
        // we'll compute all hashes in a single pass.
        
        MessageDigest[] digests = new MessageDigest[ALGORITHMS.length];
        for (int i = 0; i < ALGORITHMS.length; i++) {
            digests[i] = MessageDigest.getInstance(ALGORITHMS[i], "BC");
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
        MessageDigest digest = MessageDigest.getInstance(algorithm, "BC");
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
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}

