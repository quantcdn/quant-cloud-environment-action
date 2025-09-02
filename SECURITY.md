# Security Policy

## Supported Versions

We actively maintain and provide security updates for the following versions of this GitHub Action:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability in this GitHub Action, please report it to us as described below.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please use GitHub's private vulnerability reporting feature:

1. Go to the **Security** tab in this repository
2. Click **Report a vulnerability**
3. Fill out the vulnerability report form with the required information

This will create a private security advisory that only you and the repository maintainers can see.

**Alternative:** If you prefer, you can also email us directly at [security@quantcdn.io](mailto:security@quantcdn.io)

### What to Include

When reporting a vulnerability, please include:

- A description of the vulnerability
- Steps to reproduce the issue
- The potential impact of the vulnerability
- Any suggested fixes or mitigations (if you have them)

### What to Expect

- We will acknowledge receipt of your report within 48 hours
- We will provide regular updates on our progress through the GitHub security advisory
- We will work with you to understand and resolve the issue quickly
- We will credit you in our security advisories (unless you prefer to remain anonymous)
- Once resolved, the advisory will be published to help other users

### Security Best Practices

When using this GitHub Action, please follow these security best practices:

1. **API Key Security**: Never commit API keys to your repository. Use GitHub Secrets to store sensitive information.

2. **Least Privilege**: Ensure your API keys have only the minimum required permissions for the operations this action performs.

3. **Regular Updates**: Keep your dependencies and the action version up to date to benefit from security patches.

4. **Review Changes**: Always review the changes made by this action before deploying to production environments.

5. **Network Security**: Ensure your CI/CD environment has appropriate network security controls in place.

### Dependencies

This action depends on the following packages:
- `@actions/core` - GitHub's official core actions library
- `quant-ts-client` - Official Quant CDN TypeScript client

We monitor these dependencies for security vulnerabilities and update them regularly.

### Security Updates

Security updates will be released as patch versions (e.g., 1.0.1, 1.0.2) and will be clearly marked in the release notes.

## Contact

For general security questions or concerns, please use GitHub's private vulnerability reporting feature as described above, or contact us at [security@quantcdn.io](mailto:security@quantcdn.io).

---

*This security policy is effective as of the date of the latest commit to this repository.*
