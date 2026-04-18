package com.encryption.config;

import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.security.Security;

/**
 * Configuration for Bouncy Castle cryptographic provider.
 * Registers the Bouncy Castle provider at application startup.
 */
@Configuration
public class CryptoConfig {

    /**
     * Register the Bouncy Castle provider as the primary security provider.
     * This enables support for additional cryptographic algorithms like Twofish, Blowfish, etc.
     */
    @PostConstruct
    public void setup() {
        Security.insertProviderAt(new BouncyCastleProvider(), 1);
    }
}
