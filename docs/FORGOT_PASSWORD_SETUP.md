# Forgot Password Functionality Setup

This document explains how to set up and use the forgot password functionality in PropertyEase.

## Overview

The forgot password feature allows users to reset their passwords by receiving a secure reset link via email. The system includes:

- **API Endpoints**: `/api/auth/forgot-password` and `/api/auth/reset-password`
- **UI Components**: `ForgotPassword` and `ResetPassword` components
- **Pages**: `/forgot-password` and `/reset-password`
- **Database**: `password_reset_tokens` table for secure token storage

## Setup Instructions

### 1. Database Migration

Run the password reset tokens migration:

```bash
node scripts/run-password-reset-migration.js
```

This will create:

- `password_reset_tokens` table
- Required indexes for performance
- RLS policies for security
- Cleanup function for expired tokens

### 2. Environment Variables

Ensure these environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

### 3. Email Service Integration (Optional)

Currently, the system logs reset links to the console in development mode. To enable email sending:

1. Install an email service (e.g., SendGrid, Resend, or Nodemailer)
2. Update the `forgot-password` API endpoint to send actual emails
3. Remove the development console logging

## API Endpoints

### POST `/api/auth/forgot-password`

Sends a password reset link to the user's email.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "If an account with that email exists, we have sent a password reset link."
}
```

### POST `/api/auth/reset-password`

Resets the user's password using a valid token.

**Request Body:**

```json
{
  "token": "reset-token-uuid",
  "password": "newPassword123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now log in with your new password."
}
```

## UI Components

### ForgotPassword Component

Located at `components/forgot-password.tsx`

**Props:**

- `onBack: () => void` - Called when user clicks back
- `onSuccess: () => void` - Called after successful email send

### ResetPassword Component

Located at `components/reset-password.tsx`

**Props:**

- `token: string` - The reset token from URL
- `onBack: () => void` - Called when user clicks back
- `onSuccess: () => void` - Called after successful password reset

## Pages

### `/forgot-password`

Displays the forgot password form where users enter their email address.

### `/reset-password?token=<token>`

Displays the password reset form where users enter their new password.

## Security Features

1. **Token Expiration**: Reset tokens expire after 1 hour
2. **One-time Use**: Tokens can only be used once
3. **Secure Generation**: Tokens are generated using `crypto.randomUUID()`
4. **RLS Policies**: Database access is restricted by Row Level Security
5. **Password Validation**: Strong password requirements enforced

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

## Development Mode

In development mode, the reset link is logged to the console for testing purposes. This should be removed in production.

## Testing

1. Go to `/login`
2. Click "Forgot password?"
3. Enter a valid email address
4. Check console for reset link (development mode)
5. Click the reset link
6. Enter a new password
7. Sign in with the new password

## Troubleshooting

### Common Issues

1. **Token not found**: Ensure the token is valid and not expired
2. **Email not sent**: Check email service configuration
3. **Database errors**: Verify migration was run successfully
4. **RLS policies**: Ensure service role has proper permissions

### Database Cleanup

To clean up expired tokens manually:

```sql
SELECT cleanup_expired_password_reset_tokens();
```

## Future Enhancements

1. **Email Templates**: Customizable email templates
2. **Rate Limiting**: Prevent spam password reset requests
3. **Audit Logging**: Track password reset attempts
4. **Multi-factor Authentication**: Additional security layer
5. **Account Lockout**: Temporary lockout after multiple failed attempts


