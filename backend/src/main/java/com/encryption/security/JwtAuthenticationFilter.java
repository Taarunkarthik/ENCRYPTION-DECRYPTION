package com.encryption.security;

import com.encryption.exception.AuthenticationException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.spec.SecretKeySpec;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;

/**
 * JWT Authentication Filter for Supabase Auth tokens.
 * Validates JWT tokens from the Authorization header and sets the Spring Security context.
 */
@Slf4j
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Value("${supabase.jwt-secret}")
    private String jwtSecret;

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String token = extractToken(request);
            
            if (token != null && !token.isEmpty()) {
                Claims claims = validateToken(token);
                String userId = claims.getSubject();
                
                if (userId != null && !userId.isEmpty()) {
                    UsernamePasswordAuthenticationToken authentication = 
                            new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());
                    authentication.setDetails(claims);
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    
                    log.debug("Authenticated user: {}", userId);
                }
            }
        } catch (AuthenticationException | JwtException ex) {
            log.warn("JWT validation failed: {}", ex.getMessage());
            SecurityContextHolder.clearContext();
        }
        
        filterChain.doFilter(request, response);
    }

    /**
     * Extract JWT token from the Authorization header.
     */
    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader(AUTHORIZATION_HEADER);
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            return header.substring(BEARER_PREFIX.length());
        }
        return null;
    }

    /**
     * Validate JWT token signature and claims.
     */
    private Claims validateToken(String token) {
        try {
            SecretKeySpec keySpec = new SecretKeySpec(
                    jwtSecret.getBytes(),
                    0,
                    jwtSecret.getBytes().length,
                    "HmacSHA256"
            );
            
            Jws<Claims> jws = Jwts.parser()
                    .verifyWith(keySpec)
                    .build()
                    .parseSignedClaims(token);
            
            return jws.getPayload();
        } catch (JwtException ex) {
            throw new AuthenticationException("Invalid or expired JWT token", ex);
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.equals("/actuator/health") || path.equals("/health");
    }
}
