# Security Policy

## Supported versions

Security fixes are provided for the latest stable release and the current `main` branch.

| Version | Supported |
| --- | --- |
| 1.x | Yes |
| < 1.0 | No |

## Reporting a vulnerability

Do not report vulnerabilities, credentials, personal data, database exports, or exploit details in a public issue.

Prefer GitHub's private vulnerability reporting / Security Advisory flow for this repository. If private reporting is unavailable, open a public issue containing only a request for a private security contact channel and no vulnerability details.

Include, when possible:

- affected component and version/commit;
- impact and attack prerequisites;
- minimal reproduction steps using synthetic data;
- proposed mitigation, if known.

## Data handling

This project can process personally identifiable information for school operations. Contributions, bug reports, test fixtures, screenshots, logs, database files, and diagnostic exports must use synthetic or redacted data only.

## Secrets

Production secrets belong in Cloudflare secret storage or local ignored environment files. They must never be committed to the repository.
