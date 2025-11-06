# Security Guide

## Pre-commit Hook Setup

This project includes automatic security scanning to prevent accidentally committing sensitive data like API keys, passwords, and tokens.

### Initial Setup

After cloning the repository, run:

```bash
npm install
npx husky install
chmod +x .husky/pre-commit
```

### How It Works

The pre-commit hook automatically runs before each commit to:
- Scan staged files for potential secrets and API keys
- Check for common patterns like AWS keys, JWT tokens, database credentials
- Block commits if sensitive data is detected
- Allow commits if no issues are found

### What Gets Detected

- API keys and tokens
- AWS access keys
- Private SSH/RSA keys
- Database connection strings
- JWT tokens
- GitHub tokens
- Stripe API keys
- Slack tokens
- Generic secrets and passwords

### Whitelisted Items

The following are considered safe and won't trigger warnings:
- Supabase publishable/anon keys (meant to be public)
- Environment variable placeholders (e.g., `${API_KEY}`)
- Example/placeholder values
- Values in `node_modules`, `dist`, or build directories

### If Secrets Are Detected

When sensitive data is found, the commit will be blocked and you'll see:
- File path and line number
- Type of secret detected
- Severity level (Critical/High/Medium)
- Preview of the matched content

**What to do:**
1. Remove the sensitive data from your files
2. Store secrets in environment variables instead
3. For backend secrets, use Supabase Edge Functions with environment variables
4. Never commit real API keys or passwords

### False Positives

If the scanner incorrectly flags something as sensitive:
1. Add it to the `WHITELIST` array in `scripts/detect-secrets.js`
2. Or use `git commit --no-verify` (only if you're absolutely sure it's safe)

### Best Practices

✅ **DO:**
- Use environment variables for all secrets
- Use Supabase secrets for edge function API keys
- Store publishable keys in `.env` files (these are safe to commit)
- Review the pre-commit warnings carefully

❌ **DON'T:**
- Commit real API keys or passwords
- Use `--no-verify` unless absolutely necessary
- Store secrets in code comments or documentation
- Disable the pre-commit hook permanently

## Environment Variables

### Client-Side (Vite)
Variables prefixed with `VITE_` are exposed to the browser:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

These are safe to commit in documentation as they're meant to be public.

### Server-Side (Supabase Edge Functions)
Private secrets should be stored in Supabase and accessed in edge functions:
```typescript
const apiKey = Deno.env.get('PRIVATE_API_KEY');
```

Never expose these in client-side code.

## Reporting Security Issues

If you discover a security vulnerability, please email [your-email@example.com] instead of using the issue tracker.

## Additional Resources

- [Lovable Security Docs](https://docs.lovable.dev/features/security)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
