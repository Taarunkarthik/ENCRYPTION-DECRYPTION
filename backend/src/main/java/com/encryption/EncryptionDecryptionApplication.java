package com.encryption;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class EncryptionDecryptionApplication {

    public static void main(String[] args) {
        // Load .env from multiple potential locations
        try {
            Dotenv dotenv = null;
            String[] searchPaths = {".", "..", "./backend", "../backend"};
            
            for (String path : searchPaths) {
                try {
                    Dotenv potential = Dotenv.configure()
                        .directory(path)
                        .load();
                    // If we reach here, we found a file. Check if it contains our keys.
                    if (potential.get("SUPABASE_URL") != null) {
                        dotenv = potential;
                        System.out.println("Loaded .env configuration from: " + new java.io.File(path).getCanonicalPath());
                        break;
                    }
                } catch (Exception ignored) {}
            }

            if (dotenv != null) {
                dotenv.entries().forEach(entry -> {
                    if (System.getProperty(entry.getKey()) == null || System.getProperty(entry.getKey()).isEmpty()) {
                        System.setProperty(entry.getKey(), entry.getValue());
                    }
                });
            } else {
                System.err.println("Warning: No valid .env file found in search paths. Using system environment variables.");
            }
        } catch (Exception e) {
            System.err.println("Warning: Error during .env initialization: " + e.getMessage());
        }

        SpringApplication.run(EncryptionDecryptionApplication.class, args);
    }

}
