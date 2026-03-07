package com.example.demo.Security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        System.out.println("DEBUG: Auth Header: " + (authHeader != null ? "Found" : "Missing"));

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            if (request.getRequestURI().startsWith("/api/") && !request.getRequestURI().contains("/auth/")) {
                System.out.println("DEBUG: No Bearer token for protected URI: " + request.getRequestURI());
            }
            filterChain.doFilter(request, response);
            return;
        }

        try {
            final String jwt = authHeader.substring(7);
            final String email = jwtUtil.extractEmail(jwt);
            System.out.println("DEBUG: Token email extracted: " + email);

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                if (jwtUtil.validateToken(jwt, userDetails)) {
                    System.out.println("DEBUG: Token validated successfully for " + email + ". Roles: "
                            + userDetails.getAuthorities());
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                } else {
                    System.out.println("DEBUG: Token validation FAILED for " + email
                            + ". Token might be expired or email mismatch. Current time: " + new java.util.Date()
                            + ", Token expiration: " + jwtUtil.extractExpiration(jwt));
                }
            }
        } catch (Exception e) {
            System.out.println(
                    "DEBUG: JWT Filter Error: " + e.getMessage() + " (Type: " + e.getClass().getSimpleName() + ")");
            if (e.getMessage() != null && e.getMessage().contains("JWT signature does not match")) {
                System.out.println(
                        "DEBUG: SIGNATURE MISMATCH! Check if jwt.secret is correct and matching between generation and validation.");
            }
        }

        filterChain.doFilter(request, response);
    }
}
