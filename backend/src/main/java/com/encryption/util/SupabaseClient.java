package com.encryption.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;

import java.util.Map;

@Component
public class SupabaseClient {

    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.serviceRoleKey}")
    private String serviceRoleKey;

    @Value("${supabase.anonKey}")
    private String anonKey;

    public SupabaseClient() {
        this.httpClient = new OkHttpClient();
        this.objectMapper = new ObjectMapper();
    }

    @jakarta.annotation.PostConstruct
    public void debugConfig() {
        System.out.println("--- SUPABASE CONFIGURATION STATUS ---");
        System.out.println("URL: " + (supabaseUrl != null ? supabaseUrl : "NULL"));
        System.out.println("Service Role Key: " + (serviceRoleKey != null && !serviceRoleKey.isBlank() ? "PRESENT (Length: " + serviceRoleKey.length() + ")" : "MISSING"));
        System.out.println("Is Configured: " + isConfigured());
        if (isPlaceholderUrl(supabaseUrl)) {
            System.out.println("WARNING: Using placeholder URL!");
        }
        System.out.println("-------------------------------------");
    }

    public boolean isConfigured() {
        return !isBlank(supabaseUrl)
            && !isPlaceholderUrl(supabaseUrl)
            && !isBlank(serviceRoleKey);
    }

    public String getSupabaseUrl() {
        return supabaseUrl;
    }

    private void ensureConfigured(String operation) {
        if (!isConfigured()) {
            throw new IllegalStateException(
                "SUPABASE IS NOT CONFIGURED. SET SUPABASE_URL AND SUPABASE_SERVICE_ROLE_KEY BEFORE " + operation.toUpperCase() + "."
            );
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private boolean isPlaceholderUrl(String url) {
        return url.contains("your-project.supabase.co");
    }

    /**
     * Uploads encrypted file to Supabase Storage bucket
     */
    public void uploadFile(String bucketName, String filePath, byte[] fileContent) throws IOException {
        ensureConfigured("uploading files");
        ensureBucketExists(bucketName);
        String url = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + filePath;

        RequestBody body = RequestBody.create(fileContent, MediaType.parse("application/octet-stream"));

        Request request = new Request.Builder()
            .url(url)
            .header("Authorization", "Bearer " + serviceRoleKey)
            .header("apikey", serviceRoleKey)
            .header("Content-Type", "application/octet-stream")
            .post(body)
            .build();

    try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Failed to upload file: " + response.body().string());
            }
        }
    }

    /**
     * Ensures that a Supabase Storage bucket exists, creating it if necessary
     */
    public void ensureBucketExists(String bucketName) throws IOException {
        ensureConfigured("accessing storage buckets");
        String url = supabaseUrl + "/storage/v1/bucket";

        // Check if bucket exists
        Request checkRequest = new Request.Builder()
            .url(url + "/" + bucketName)
            .header("Authorization", "Bearer " + serviceRoleKey)
            .header("apikey", serviceRoleKey)
            .get()
            .build();

        try (Response response = httpClient.newCall(checkRequest).execute()) {
            if (response.isSuccessful()) {
                return; // Bucket exists
            }
        }

        // Create bucket if it doesn't exist
        Map<String, Object> bodyMap = new HashMap<>();
        bodyMap.put("id", bucketName);
        bodyMap.put("name", bucketName);
        bodyMap.put("public", false);

        String jsonBody = objectMapper.writeValueAsString(bodyMap);
        RequestBody body = RequestBody.create(jsonBody, MediaType.parse("application/json"));

        Request createRequest = new Request.Builder()
            .url(url)
            .header("Authorization", "Bearer " + serviceRoleKey)
            .header("apikey", serviceRoleKey)
            .header("Content-Type", "application/json")
            .post(body)
            .build();

        try (Response response = httpClient.newCall(createRequest).execute()) {
            if (!response.isSuccessful()) {
                String error = response.body() != null ? response.body().string() : "Unknown error";
                // If it already exists (race condition), just ignore
                if (!error.contains("already exists")) {
                    throw new IOException("Failed to create bucket: " + error);
                }
            }
        }
    }

    /**
     * Downloads encrypted file from Supabase Storage bucket as a stream
     */
    public InputStream downloadFileAsStream(String bucketName, String filePath) throws IOException {
        ensureConfigured("downloading files");
        String url = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + filePath;

        Request request = new Request.Builder()
            .url(url)
            .header("Authorization", "Bearer " + serviceRoleKey)
            .header("apikey", serviceRoleKey)
            .get()
            .build();

        Response response = httpClient.newCall(request).execute();
        if (!response.isSuccessful()) {
            response.close();
            throw new IOException("Failed to download file: " + response.message());
        }
        return response.body().byteStream();
    }


    /**
     * Downloads encrypted file from Supabase Storage bucket
     */
    public byte[] downloadFile(String bucketName, String filePath) throws IOException {
        ensureConfigured("downloading files");
        String url = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + filePath;

        Request request = new Request.Builder()
            .url(url)
            .header("Authorization", "Bearer " + serviceRoleKey)
            .header("apikey", serviceRoleKey)
            .get()
            .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Failed to download file: " + response.message());
            }
            return response.body().bytes();
        }
    }

    /**
     * Deletes file from Supabase Storage bucket
     */
    public void deleteFile(String bucketName, String filePath) throws IOException {
        ensureConfigured("deleting files");
        String url = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + filePath;

        Request request = new Request.Builder()
            .url(url)
            .header("Authorization", "Bearer " + serviceRoleKey)
            .header("apikey", serviceRoleKey)
            .delete()
            .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Failed to delete file: " + response.message());
            }
        }
    }

    /**
     * Inserts a record into Supabase database
     */
    public void insertRecord(String table, Map<String, Object> data) throws IOException {
        ensureConfigured("writing database records");
        String url = supabaseUrl + "/rest/v1/" + table;

        String jsonData = objectMapper.writeValueAsString(data);
        RequestBody body = RequestBody.create(jsonData, MediaType.parse("application/json"));

        Request request = new Request.Builder()
            .url(url)
            .header("Authorization", "Bearer " + serviceRoleKey)
            .header("apikey", serviceRoleKey)
            .header("Content-Type", "application/json")
            .header("Prefer", "return=minimal")
            .post(body)
            .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "No error body";
                System.err.println("SUPABASE ERROR [INSERT]: " + response.code() + " " + response.message() + " - " + errorBody);
                throw new IOException("Failed to insert record: " + response.message() + " - " + errorBody);
            }
        }
    }

    /**
     * Queries records from Supabase database
     */
    public String queryRecords(String table, String filter) throws IOException {
        ensureConfigured("reading database records");
        String url = supabaseUrl + "/rest/v1/" + table;
        if (filter != null && !filter.isEmpty()) {
            url += "?" + filter;
        }

        Request request = new Request.Builder()
            .url(url)
            .header("Authorization", "Bearer " + serviceRoleKey)
            .header("apikey", serviceRoleKey)
            .get()
            .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "No error body";
                System.err.println("SUPABASE ERROR [QUERY]: " + response.code() + " " + response.message() + " - " + errorBody);
                throw new IOException("Failed to query records: " + response.message() + " - " + errorBody);
            }
            return response.body().string();
        }
    }

    /**
     * Deletes records from Supabase database
     */
    public void deleteRecords(String table, String filter) throws IOException {
        ensureConfigured("deleting database records");
        String url = supabaseUrl + "/rest/v1/" + table;
        if (filter != null && !filter.isEmpty()) {
            url += "?" + filter;
        }

        Request request = new Request.Builder()
            .url(url)
            .header("Authorization", "Bearer " + serviceRoleKey)
            .header("apikey", serviceRoleKey)
            .delete()
            .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "No error body";
                throw new IOException("Failed to delete records: " + response.message() + " - " + errorBody);
            }
        }
    }

    /**
     * Updates records in Supabase database.
     */
    public void updateRecords(String table, String filter, Map<String, Object> data) throws IOException {
        ensureConfigured("updating database records");
        String url = supabaseUrl + "/rest/v1/" + table;
        if (filter != null && !filter.isEmpty()) {
            url += "?" + filter;
        }

        String jsonData = objectMapper.writeValueAsString(data);
        RequestBody body = RequestBody.create(jsonData, MediaType.parse("application/json"));

        Request request = new Request.Builder()
            .url(url)
            .header("Authorization", "Bearer " + serviceRoleKey)
            .header("apikey", serviceRoleKey)
            .header("Content-Type", "application/json")
            .header("Prefer", "return=minimal")
            .patch(body)
            .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "No error body";
                throw new IOException("Failed to update records: " + response.message() + " - " + errorBody);
            }
        }
    }

    /**
     * Deletes a user from Supabase Auth (requires service role key)
     */
    public void deleteUser(String userId) throws IOException {
        String url = supabaseUrl + "/auth/v1/admin/users/" + userId;

        Request request = new Request.Builder()
            .url(url)
            .header("Authorization", "Bearer " + serviceRoleKey)
            .header("apikey", serviceRoleKey)
            .delete()
            .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "No error body";
                throw new IOException("Failed to delete user from Auth: " + response.message() + " - " + errorBody);
            }
        }
    }
}
