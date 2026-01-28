# Security Audit Report

**Date:** January 28, 2026
**Target:** Martial Arts Manager Application
**Auditor:** GitHub Copilot

## Executive Summary

The application has a solid foundation with secure password hashing (PBKDF2) and `HttpOnly` cookies for refresh tokens. However, there are critical logic flaws in the registration process and data access controls that could allow privilege escalation and data leakage. Additionally, the absence of defense-in-depth measures like rate limiting and security headers leaves the application exposed to common web attacks.

## Vulnerabilities Identified

### 1. Privilege Escalation via Registration (Critical)
- **Description:** The `/api/auth/register` endpoint accepts a `role` parameter from the request body without restriction. Although new accounts are set to `is_approved=0` (pending approval), an attacker can register as `admin`.
- **Impact:** An administrator reviewing pending approvals might inadvertently approve a malicious user as an administrator, granting full control over the system.
- **Location:** `functions/api/auth/register.ts`
- **Mitigation:** Force the role to `student` for public registrations.

### 2. PII Data Leakage to Students (High)
- **Description:** The `/api/students` endpoint allows non-admin users to view student records where `instructor_id IS NULL`. This logic is intended for instructors to claim students, but it also applies to users with the `student` role.
- **Impact:** Any authenticated student can view the personal information (email, phone, DOB) of all unassigned/new students.
- **Location:** `functions/api/students.ts`
- **Mitigation:** Restrict `GET /api/students` access to `admin` and `instructor` roles only.

### 3. Missing Rate Limiting (Medium)
- **Description:** There is no rate limiting on the `/api/auth/login` endpoint or other sensitive actions.
- **Impact:** Susceptible to brute-force password attacks and Denial of Service (DoS).
- **Location:** `functions/api/auth/login.ts`, `functions/_middleware.ts`
- **Mitigation:** Implement a rate limiting mechanism using KV or Durable Objects (Cloudflare specific) or a simple in-memory counter if ephemeral is acceptable, though KV is preferred for serverless.

### 4. Missing Security Headers (Medium)
- **Description:** The application does not serve standard security headers.
- **Impact:** Increased risk of XSS, Clickjacking, and MIME sniffing attacks.
- **Missing Headers:** `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.
- **Location:** `functions/_middleware.ts`
- **Mitigation:** Add a middleware to inject these headers.

### 5. Insecure Access Token Storage (Medium)
- **Description:** The frontend stores the short-lived JWT access token in `localStorage`.
- **Impact:** If an XSS vulnerability is introduced, the access token can be stolen.
- **Location:** `src/context/AuthContext.tsx`
- **Mitigation:** Move access token storage to memory (React state) or consider `HttpOnly` cookies for access tokens as well, although memory is acceptable given the refresh token is secure.

## Remediation Plan

We will proceed with the following fixes in the next phase:

1.  **Fix Role Assignment**: Modify `functions/api/auth/register.ts` to ignore the `role` field in the request body and force it to `student`.
2.  **Harden Student API Access**: Modify `functions/api/students.ts` to return `403 Forbidden` if the requester's role is `student`.
3.  **Implement Security Headers**: Update `functions/_middleware.ts` to add necessary security headers to every response.
4.  **Add Rate Limiting**: Implement a basic rate limiter in `functions/_middleware.ts` or `functions/api/auth/login.ts` using Cloudflare's specific capabilities (or a simple IP-based map if state persistence is not critical for MVP).
5.  **Cleanup**: Review `functions/utils/jwt.ts` to ensure `JWT_SECRET` is never logged or exposed.

---
*End of Audit*
