package com.encryption.controller;

import com.encryption.util.SupabaseClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    private final SupabaseClient supabaseClient;

    public AdminController(SupabaseClient supabaseClient) {
        this.supabaseClient = supabaseClient;
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable String userId) {
        try {
            // Delete from auth.users (requires service role)
            supabaseClient.deleteUser(userId);
            
            // Delete from public.profiles (if not already handled by CASCADE)
            // If the foreign key in profiles is set to ON DELETE CASCADE, this is automatic
            
            return ResponseEntity.ok().body(Map.of("message", "User deleted successfully"));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete user: " + e.getMessage()));
        }
    }
}
