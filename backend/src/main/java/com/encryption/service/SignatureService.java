package com.encryption.service;

import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.stereotype.Service;

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

    /**
     * Generates a new RSA key pair (2048-bit).
     * Returns Base64-encoded private and public keys.
     */
    public KeyPairResult generateKeyPair() throws NoSuchAlgorithmException {
        KeyPairGenerator keyGen = KeyPairGenerator.getInstance(KEY_ALGORITHM, "BC");
        keyGen.initialize(KEY_SIZE, new SecureRandom());
        KeyPair keyPair = keyGen.generateKeyPair();

        String privateKeyBase64 = Base64.getEncoder().encodeToString(keyPair.getPrivate().getEncoded());
        String publicKeyBase64 = Base64.getEncoder().encodeToString(keyPair.getPublic().getEncoded());

        return new KeyPairResult(privateKeyBase64, publicKeyBase64);
    }

    /**
     * Signs the file bytes using an RSA private key (PKCS#8 Base64 encoded).
     * Returns the Base64-encoded signature.
     */
    public String signFile(byte[] fileBytes, String privateKeyBase64) throws Exception {
        byte[] keyBytes = Base64.getDecoder().decode(privateKeyBase64);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
        KeyFactory keyFactory = KeyFactory.getInstance(KEY_ALGORITHM, "BC");
        PrivateKey privateKey = keyFactory.generatePrivate(spec);

        Signature signer = Signature.getInstance(ALGORITHM, "BC");
        signer.initSign(privateKey, new SecureRandom());
        signer.update(fileBytes);

        byte[] signature = signer.sign();
        return Base64.getEncoder().encodeToString(signature);
    }

    /**
     * Verifies a file signature using an RSA public key (X.509 Base64 encoded).
     * Returns true if the signature is valid.
     */
    public boolean verifySignature(byte[] fileBytes, String signatureBase64, String publicKeyBase64) throws Exception {
        byte[] keyBytes = Base64.getDecoder().decode(publicKeyBase64);
        X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
        KeyFactory keyFactory = KeyFactory.getInstance(KEY_ALGORITHM, "BC");
        PublicKey publicKey = keyFactory.generatePublic(spec);

        Signature verifier = Signature.getInstance(ALGORITHM, "BC");
        verifier.initVerify(publicKey);
        verifier.update(fileBytes);

        byte[] signature = Base64.getDecoder().decode(signatureBase64);
        return verifier.verify(signature);
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
