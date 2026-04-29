package com.encryption.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Value("${supabase.jwtSecret}")
    private String jwtSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        // Skip JWT validation for health check and OPTIONS requests
        if (path.equals("/api/health") || "OPTIONS".equalsIgnoreCase(method)) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);

                // Decode JWT secret
                byte[] keyBytes;
                try {
                    keyBytes = io.jsonwebtoken.io.Decoders.BASE64.decode(jwtSecret);
                } catch (Exception e) {
                    keyBytes = jwtSecret.getBytes();
                }

                if (keyBytes.length < 32) {
                    logger.warn("JWT Secret is too short for HS256. Verify your SUPABASE_JWT_SECRET in .env");
                }

                // First, parse without verification to check the algorithm (for debugging/logging)
                try {
                    String[] parts = token.split("\\.");
                    if (parts.length >= 2) {
                        String headerJson = new String(java.util.Base64.getUrlDecoder().decode(parts[0]));
                        logger.debug("JWT Header: " + headerJson);
                    }
                } catch (Exception e) {
                    // Ignore header parsing errors
                }

                Claims claims = Jwts.parser()
                    .verifyWith(Keys.hmacShaKeyFor(keyBytes))
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

                String userId = claims.getSubject();
                String role = claims.get("role", String.class);
                
                // 1. Check app_metadata (Server-side managed roles)
                Map<?, ?> appMetadata = claims.get("app_metadata", Map.class);
                if (appMetadata != null && appMetadata.get("role") != null) {
                    role = (String) appMetadata.get("role");
                }
                
                // 2. Check user_metadata (User-side roles - allowed for this project's demo purposes)
                Map<?, ?> userMetadata = claims.get("user_metadata", Map.class);
                if (role == null && userMetadata != null && userMetadata.get("role") != null) {
                    role = (String) userMetadata.get("role");
                }
                
                if (userId != null) {
                    List<org.springframework.security.core.GrantedAuthority> authorities = new ArrayList<>();
                    if ("admin".equalsIgnoreCase(role)) {
                        authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"));
                    } else {
                        authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER"));
                    }

                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        userId, null, authorities
                    );
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }

            } catch (io.jsonwebtoken.security.SignatureException e) {
                logger.error("JWT Signature Validation failed: " + e.getMessage() + ". Check if SUPABASE_JWT_SECRET matches Supabase project settings.");
            } catch (io.jsonwebtoken.ExpiredJwtException e) {
                logger.warn("JWT Expired: " + e.getMessage());
            } catch (Exception e) {
                logger.error("JWT Validation failed: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            }
        }

        // Continue the filter chain. If authentication was successful, SecurityContext will have it.
        // If not, Spring Security's authorization rules in SecurityConfig will catch it.
        filterChain.doFilter(request, response);
    }
}
