package com.encryption.service;

import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.security.*;
import java.security.spec.*;
import java.util.Base64;

@Service
public class SignatureService {

    private static final String ALGORITHM = "SHA256withRSA";
    private static final String KEY_ALGORITHM = "RSA";
    private static final int KEY_SIZE = 2048;

    static {
        Security.addProvider(new BouncyCastleProvider());
    }

    private static final SecureRandom secureRandom = new SecureRandom();

    /**
     * Generates a new RSA key pair (2048-bit).
     * Returns Base64-encoded private and public keys.
     */
    public KeyPairResult generateKeyPair() throws NoSuchAlgorithmException, NoSuchProviderException {
        KeyPairGenerator keyGen = KeyPairGenerator.getInstance(KEY_ALGORITHM, "BC");
        keyGen.initialize(KEY_SIZE, secureRandom);
        KeyPair keyPair = keyGen.generateKeyPair();

        String privateKeyBase64 = Base64.getEncoder().encodeToString(keyPair.getPrivate().getEncoded());
        String publicKeyBase64 = Base64.getEncoder().encodeToString(keyPair.getPublic().getEncoded());

        return new KeyPairResult(privateKeyBase64, publicKeyBase64);
    }

    /**
     * Signs a byte array using an RSA private key.
     * Convenience method for smaller data.
     */
    public String signFile(byte[] fileBytes, String privateKeyBase64) throws Exception {
        try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(fileBytes)) {
            return signFileStream(bais, privateKeyBase64);
        }
    }

    /**
     * Signs the file stream using an RSA private key.
     * Returns the Base64-encoded signature.
     */
    public String signFileStream(InputStream inputStream, String privateKeyBase64) throws Exception {
        byte[] keyBytes = Base64.getDecoder().decode(privateKeyBase64);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
        KeyFactory keyFactory = KeyFactory.getInstance(KEY_ALGORITHM, "BC");
        PrivateKey privateKey = keyFactory.generatePrivate(spec);

        Signature signer = Signature.getInstance(ALGORITHM, "BC");
        signer.initSign(privateKey, secureRandom);

        byte[] buffer = new byte[8192];
        int bytesRead;
        while ((bytesRead = inputStream.read(buffer)) != -1) {
            signer.update(buffer, 0, bytesRead);
        }

        byte[] signature = signer.sign();
        return Base64.getEncoder().encodeToString(signature);
    }

    /**
     * Verifies a byte array signature using an RSA public key.
     * Convenience method for smaller data.
     */
    public boolean verifySignature(byte[] fileBytes, String signatureBase64, String publicKeyBase64) throws Exception {
        try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(fileBytes)) {
            return verifySignatureStream(bais, signatureBase64, publicKeyBase64);
        }
    }

    /**
     * Verifies a file stream signature using an RSA public key.
     */
    public boolean verifySignatureStream(InputStream inputStream, String signatureBase64, String publicKeyBase64) throws Exception {
        byte[] keyBytes = Base64.getDecoder().decode(publicKeyBase64);
        X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
        KeyFactory keyFactory = KeyFactory.getInstance(KEY_ALGORITHM, "BC");
        PublicKey publicKey = keyFactory.generatePublic(spec);

        Signature verifier = Signature.getInstance(ALGORITHM, "BC");
        verifier.initVerify(publicKey);

        byte[] buffer = new byte[8192];
        int bytesRead;
        while ((bytesRead = inputStream.read(buffer)) != -1) {
            verifier.update(buffer, 0, bytesRead);
        }

        byte[] signature = Base64.getDecoder().decode(signatureBase64);
        return verifier.verify(signature);
    }

    /**
     * Creates a signed file by embedding the signature at the end.
     * (Note: For embedding, we still need to know the length of the original data,
     * so this remains byte-array based for now as it's typically used for smaller assets.
     * However, the signing part now uses streaming if possible.)
     */
    public byte[] createSignedFile(byte[] fileBytes, String privateKeyBase64) throws Exception {
        java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(fileBytes);
        String signatureBase64 = signFileStream(bais, privateKeyBase64);
        byte[] signature = Base64.getDecoder().decode(signatureBase64);
        
        byte[] signedFile = new byte[fileBytes.length + signature.length + 4 + 6];
        System.arraycopy(fileBytes, 0, signedFile, 0, fileBytes.length);
        System.arraycopy(signature, 0, signedFile, fileBytes.length, signature.length);
        
        // Add signature length (4 bytes)
        int sigLen = signature.length;
        signedFile[signedFile.length - 10] = (byte) (sigLen >> 24);
        signedFile[signedFile.length - 9] = (byte) (sigLen >> 16);
        signedFile[signedFile.length - 8] = (byte) (sigLen >> 8);
        signedFile[signedFile.length - 7] = (byte) sigLen;
        
        // Add magic string "SIGNED" (6 bytes)
        System.arraycopy("SIGNED".getBytes(), 0, signedFile, signedFile.length - 6, 6);
        
        return signedFile;
    }

    /**
     * Verifies an embedded signature in a signed file.
     */
    public boolean verifyEmbeddedSignature(byte[] signedFileBytes, String publicKeyBase64) throws Exception {
        if (signedFileBytes.length < 10) return false;
        
        // Check magic string
        String magic = new String(signedFileBytes, signedFileBytes.length - 6, 6);
        if (!"SIGNED".equals(magic)) {
            return false;
        }
        
        // Get signature length
        int sigLen = ((signedFileBytes[signedFileBytes.length - 10] & 0xFF) << 24) |
                     ((signedFileBytes[signedFileBytes.length - 9] & 0xFF) << 16) |
                     ((signedFileBytes[signedFileBytes.length - 8] & 0xFF) << 8) |
                     (signedFileBytes[signedFileBytes.length - 7] & 0xFF);
                     
        if (sigLen <= 0 || sigLen > signedFileBytes.length - 10) return false;
        
        int originalLen = signedFileBytes.length - 10 - sigLen;
        byte[] originalData = new byte[originalLen];
        byte[] signature = new byte[sigLen];
        
        System.arraycopy(signedFileBytes, 0, originalData, 0, originalLen);
        System.arraycopy(signedFileBytes, originalLen, signature, 0, sigLen);
        
        String signatureBase64 = Base64.getEncoder().encodeToString(signature);
        java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(originalData);
        return verifySignatureStream(bais, signatureBase64, publicKeyBase64);
    }

    /**
     * Inner class to hold generated key pair results.
     */
    public static class KeyPairResult {
        private final String privateKeyBase64;
        private final String publicKeyBase64;

        public KeyPairResult(String privateKeyBase64, String publicKeyBase64) {
            this.privateKeyBase64 = privateKeyBase64;
            this.publicKeyBase64 = publicKeyBase64;
        }

        public String getPrivateKeyBase64() { return privateKeyBase64; }
        public String getPublicKeyBase64() { return publicKeyBase64; }
    }
}

