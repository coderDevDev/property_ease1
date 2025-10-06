# Password Reset Integration Guide

## Connecting to Existing Login System

### 1. Update Login Components

Add "Forgot Password" links to your existing login components:

#### In `components/login-screen.tsx`:

```tsx
// Add this button after the login form
<Button
  variant="link"
  onClick={onForgotPassword}
  className="text-blue-600 hover:text-blue-700 text-sm">
  Forgot your password?
</Button>
```

#### In `components/tabbed-login.tsx`:

```tsx
// Add forgot password link in each tab
<div className="text-center mt-4">
  <Button
    variant="link"
    onClick={onForgotPassword}
    className="text-blue-600 hover:text-blue-700 text-sm">
    Forgot your password?
  </Button>
</div>
```

### 2. Update Login Page

Modify `app/login/page.tsx` to handle forgot password navigation:

```tsx
const handleForgotPassword = () => {
  router.push('/forgot-password');
};

// Pass this handler to your login components
```

### 3. Update Navigation

Add forgot password to your main navigation or auth flow:

```tsx
// In your main auth component
const authScreens = {
  login: <LoginScreen onForgotPassword={handleForgotPassword} />,
  forgotPassword: <ForgotPasswordScreen onBack={handleBackToLogin} />
  // ... other screens
};
```

## Supabase Dashboard Configuration

### 1. Email Templates

1. Go to Supabase Dashboard → Authentication → Email Templates
2. Select "Reset Password" template
3. Update the template:
   ```html
   <h2>Reset Your Password</h2>
   <p>Click the link below to reset your password:</p>
   <a href="{{ .ConfirmationURL }}">Reset Password</a>
   <p>This link will expire in 1 hour.</p>
   ```

### 2. URL Configuration

1. Go to Authentication → URL Configuration
2. Set Site URL: `http://localhost:3000` (development)
3. Add Redirect URLs:
   - `http://localhost:3000/reset-password`
   - `https://yourdomain.com/reset-password` (production)

### 3. SMTP Configuration (Optional)

If you want to use your own email provider:

1. Go to Authentication → SMTP Settings
2. Configure your SMTP provider
3. Test email delivery

## Environment Variables

Create or update your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email Configuration (if using custom SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Testing Checklist

### ✅ Basic Functionality

- [ ] Forgot password page loads correctly
- [ ] Email validation works
- [ ] API returns success for valid emails
- [ ] Reset password page loads from email link
- [ ] Password validation works
- [ ] Password update succeeds
- [ ] Redirect to login works

### ✅ Error Handling

- [ ] Invalid email format shows error
- [ ] Network errors are handled gracefully
- [ ] Invalid reset tokens are rejected
- [ ] Expired tokens show appropriate message
- [ ] Password requirements are enforced

### ✅ UI/UX

- [ ] Responsive design works on mobile
- [ ] Loading states are shown
- [ ] Success messages are clear
- [ ] Error messages are helpful
- [ ] Navigation between pages works

### ✅ Security

- [ ] Tokens expire after 1 hour
- [ ] Password strength requirements enforced
- [ ] No sensitive data exposed in errors
- [ ] Rate limiting works (Supabase default)

## Production Deployment

### 1. Environment Variables

Update for production:

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 2. Supabase Configuration

- Update Site URL to production domain
- Add production redirect URLs
- Configure production SMTP (if needed)

### 3. Testing

- Test with real email addresses
- Verify email delivery
- Test password reset flow end-to-end
- Check error handling in production

## Troubleshooting

### Common Issues

1. **"User not found" error**

   - Check if user exists in Supabase Auth
   - Verify email address is correct

2. **Email not received**

   - Check Supabase Auth logs
   - Verify SMTP configuration
   - Check spam folder

3. **Reset link doesn't work**

   - Check URL configuration in Supabase
   - Verify redirect URLs are set
   - Check if token has expired

4. **Environment variables not working**
   - Restart development server
   - Check `.env.local` file exists
   - Verify variable names are correct

### Debug Mode

Enable debug logging by adding to your API routes:

```tsx
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', { email, data, error });
}
```

## Support

If you encounter issues:

1. Check Supabase Auth logs
2. Verify environment variables
3. Test API endpoints directly
4. Check browser console for errors
5. Review Supabase documentation
