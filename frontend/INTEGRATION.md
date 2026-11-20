# Frontend-Backend Integration Guide

## Overview
The BitSilo frontend is now fully integrated with the Go backend API, providing real-time authentication, wallet management, and transaction processing.

## API Configuration

### Environment Variables
Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

For production, update this to your production API URL.

## Backend Setup

### 1. Start the Backend Server

```bash
# From project root
cd /home/molu/go/src/Molu/bitsilo

# Start the wallet service with API server
./wallet-app serve
```

The backend API will run on `http://localhost:8080`

### 2. Verify Backend is Running

```bash
# Check API health
curl http://localhost:8080/api/v1/auth/register
```

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## API Integration Features

### Authentication

#### Registration
- **Endpoint**: `POST /api/v1/auth/register`
- **Feature**: Automatic login after successful registration
- **Security**: Passwords are hashed on the backend
- **Form Fields**:
  - Full Name (username in backend)
  - Email
  - Password (min 8 characters)
  - Confirm Password
  - Referral Code (optional)

#### Login
- **Endpoint**: `POST /api/v1/auth/login`
- **Feature**: JWT token-based authentication
- **Token Storage**: Stored in localStorage
- **Auto-redirect**: Redirects to dashboard on success

### Protected Routes
All authenticated pages use the `ProtectedRoute` component:
- `/dashboard`
- `/send`
- `/receive`
- `/history`
- `/settings`
- `/support`

### Wallet Operations

#### Get Balances
```typescript
const response = await api.getBalances('ETH', 'ethereum');
```

#### Get All Balances
```typescript
const response = await api.getAllBalances();
```

#### Request Deposit Address
```typescript
const response = await api.requestAddress('ethereum');
```

#### Send Transaction
```typescript
// 1. Preview transaction
const preview = await api.sendPreview(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f8f3a',
  'ETH',
  '0.05',
  'ethereum'
);

// 2. Approve with PIN
const result = await api.approveSend(transaction_id, pin);
```

#### Internal Send (User-to-User)
```typescript
const response = await api.internalSend(
  'recipient_username',
  'USDT',
  '100',
  'ethereum'
);
```

#### Get Transaction History
```typescript
const response = await api.getHistory(50, 0);
```

## API Client Usage

### Import the API Client

```typescript
import { api, auth } from '@/lib/api';
```

### Make Authenticated Requests

```typescript
// The API client automatically includes the JWT token
// if the user is logged in

try {
  const balances = await api.getAllBalances();
  console.log(balances);
} catch (error) {
  console.error('API Error:', error);
}
```

### Handle Errors

```typescript
import { ApiError } from '@/lib/api';

try {
  await api.sendPreview(...);
} catch (error) {
  if (error instanceof ApiError) {
    console.log('Status:', error.status);
    console.log('Message:', error.message);
    console.log('Data:', error.data);
  }
}
```

### Token Management

```typescript
import { auth } from '@/lib/api';

// Set token after login
auth.setToken(token);

// Get current token
const token = auth.getToken();

// Check if authenticated
const isAuth = auth.isAuthenticated();

// Remove token (logout)
auth.removeToken();
```

## Form Security Features

### Autocomplete Prevention
All authentication forms have `autoComplete="off"` to prevent browser prefilling of sensitive data:
- Full Name
- Email
- Password
- Confirm Password
- Referral Code

### Password Visibility Toggle
The `PasswordInput` component provides:
- Show/Hide password functionality
- Eye icon toggle button
- Consistent styling with error states
- Proper autocomplete attributes

## Component Structure

### API Client (`lib/api.ts`)
- Type-safe API methods
- Automatic JWT token handling
- Comprehensive error handling
- Request/Response type definitions

### Protected Route (`components/auth/ProtectedRoute.tsx`)
- Checks for valid JWT token
- Redirects to login if unauthenticated
- Shows loading state during check

### Password Input (`components/auth/PasswordInput.tsx`)
- Reusable password field with show/hide
- Error state handling
- Autocomplete configuration

### Auth Form (`components/auth/AuthForm.tsx`)
- Integrated with backend API
- Client-side validation
- Server error handling
- Auto-login after registration

## Testing the Integration

### 1. Test Registration

```bash
# Start backend
./wallet-app serve

# In browser, go to:
http://localhost:3000/auth/signup

# Fill form and submit
# Check browser console for API responses
# Check backend logs for incoming requests
```

### 2. Test Login

```bash
# Go to:
http://localhost:3000/auth/login

# Login with registered credentials
# Should redirect to dashboard
# Check localStorage for JWT token
```

### 3. Test Protected Routes

```bash
# Try accessing dashboard without login:
http://localhost:3000/dashboard
# Should redirect to login

# Login then access dashboard
# Should load successfully
```

## CORS Configuration

If running frontend and backend on different domains, ensure CORS is configured in the backend:

```go
// In your Gin router setup
router.Use(cors.New(cors.Config{
    AllowOrigins:     []string{"http://localhost:3000"},
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
    AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
    ExposeHeaders:    []string{"Content-Length"},
    AllowCredentials: true,
}))
```

## Production Deployment

### 1. Build Frontend

```bash
cd frontend
npm run build
```

### 2. Update Environment Variable

```env
NEXT_PUBLIC_API_URL=https://yourapi.com/api/v1
```

### 3. Deploy

The built files in `.next` can be deployed to:
- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify
- Custom Node.js server

## Troubleshooting

### "Network Error" or "Failed to Fetch"
- Check backend is running on correct port
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS configuration

### "Unauthorized" Errors
- Token may be expired
- Check if token is being sent in Authorization header
- Verify backend JWT secret matches

### Autocomplete Still Showing
- Clear browser cache
- Check browser password manager settings
- Try different browser/incognito mode

### Password Toggle Not Working
- Check PasswordInput component is imported correctly
- Verify button event handlers are not prevented

## Next Steps

1. **Implement Real-time Features**
   - Connect transaction history to backend
   - Fetch real balance data
   - WebSocket for live updates

2. **Add More API Integrations**
   - Payment requests
   - User settings
   - Notifications

3. **Enhanced Error Handling**
   - Toast notifications
   - Retry logic
   - Offline support

4. **Security Enhancements**
   - Token refresh mechanism
   - Rate limiting
   - 2FA integration

## Support

For issues or questions:
- Check backend logs: `tail -f wallet.log`
- Check browser console for frontend errors
- Review API documentation in backend code
