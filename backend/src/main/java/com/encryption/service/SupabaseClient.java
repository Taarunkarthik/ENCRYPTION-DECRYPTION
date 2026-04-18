package com.encryption.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;

/**
 * Supabase client for interacting with Supabase REST API.
 * Handles authentication, storage, and database operations.
 */
@Slf4j
@Service
public class SupabaseClient {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    @Value("${supabase.service-role-key}")
    private String serviceRoleKey;

    @Value("${supabase.storage-bucket}")
    private String storageBucket;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final CloseableHttpClient httpClient = HttpClients.createDefault();

    /**
     * Upload file to Supabase Storage.
     */
    public String uploadFile(byte[] fileData, String fileName, String userId) throws Exception {
        try {
            String storagePath = userId + "/" + fileName;
            String uploadUrl = supabaseUrl + "/storage/v1/object/" + storageBucket + "/" + storagePath;

            HttpPost request = new HttpPost(uploadUrl);
            request.setHeader("Authorization", "Bearer " + supabaseKey);
            request.setHeader("Content-Type", "application/octet-stream");
            request.setEntity(new StringEntity(new String(fileData)));

            var response = httpClient.execute(request);
            String responseBody = EntityUtils.toString(response.getEntity());
            
            log.debug("File uploaded successfully to Supabase Storage: {}", storagePath);
            return storagePath;
        } catch (Exception ex) {
            log.error("Failed to upload file to Supabase Storage: {}", ex.getMessage(), ex);
            throw ex;
        }
    }

    /**
     * Download file from Supabase Storage.
     */
    public byte[] downloadFile(String filePath) throws Exception {
        try {
            String downloadUrl = supabaseUrl + "/storage/v1/object/" + storageBucket + "/" + filePath;

            HttpGet request = new HttpGet(downloadUrl);
            request.setHeader("Authorization", "Bearer " + supabaseKey);

            var response = httpClient.execute(request);
            byte[] fileData = EntityUtils.toByteArray(response.getEntity());
            
            log.debug("File downloaded from Supabase Storage: {}", filePath);
            return fileData;
        } catch (Exception ex) {
            log.error("Failed to download file from Supabase Storage: {}", ex.getMessage(), ex);
            throw ex;
        }
    }

    /**
     * Insert audit log entry into Supabase.
     */
    public void insertAuditLog(String userId, String action, String fileName, Long fileSizeBytes) {
        try {
            String dbUrl = supabaseUrl + "/rest/v1/audit_logs";

            ObjectNode auditLog = objectMapper.createObjectNode();
            auditLog.put("user_id", userId);
            auditLog.put("action", action);
            auditLog.put("file_name", fileName);
            auditLog.put("file_size_bytes", fileSizeBytes);

            HttpPost request = new HttpPost(dbUrl);
            request.setHeader("Authorization", "Bearer " + serviceRoleKey);
            request.setHeader("Content-Type", "application/json");
            request.setEntity(new StringEntity(objectMapper.writeValueAsString(auditLog)));

            var response = httpClient.execute(request);
            int statusCode = response.getCode();
            
            if (statusCode == 201 || statusCode == 200) {
                log.debug("Audit log inserted successfully");
            } else {
                log.warn("Audit log insertion returned status code: {}", statusCode);
            }
        } catch (Exception ex) {
            log.error("Failed to insert audit log: {}", ex.getMessage(), ex);
            // Don't throw - audit logging failure shouldn't break the operation
        }
    }

    /**
     * Fetch audit logs for a user from Supabase.
     */
    public ArrayNode fetchAuditLogs(String userId) {
        try {
            String dbUrl = supabaseUrl + "/rest/v1/audit_logs?user_id=eq." + userId + "&order=created_at.desc";

            HttpGet request = new HttpGet(dbUrl);
            request.setHeader("Authorization", "Bearer " + serviceRoleKey);

            var response = httpClient.execute(request);
            String responseBody = EntityUtils.toString(response.getEntity());
            
            ArrayNode logs = (ArrayNode) objectMapper.readTree(responseBody);
            log.debug("Fetched {} audit logs for user {}", logs.size(), userId);
            return logs;
        } catch (Exception ex) {
            log.error("Failed to fetch audit logs: {}", ex.getMessage(), ex);
            return objectMapper.createArrayNode();
        }
    }
}
