# QuickBooks API Integration - Quick Start Guide

## Overview

This project includes a minimal QuickBooks connector that can retrieve customer information using the `node-quickbooks` library and OAuth 2.0 authentication.

## What's Been Set Up

✅ **Dependencies Installed**
- `node-quickbooks` library installed
- Environment variables configured in `.env`

✅ **Files Created**
- `src/adapters/quickBooks.ts` - TypeScript connector class
- `src/types/node-quickbooks.d.ts` - TypeScript definitions
- `src/examples/quickBooksExample.ts` - TypeScript example
- `quickbooks-test.js` - JavaScript test file (recommended for testing)
- `docs/QUICKBOOKS_INTEGRATION.md` - Detailed documentation

## Quick Test

Run the JavaScript test to see the integration in action:

```bash
node quickbooks-test.js
```

This will:
1. ✅ Show your OAuth authorization URL
2. ⚠️ Prompt you to complete OAuth flow to get tokens
3. 🔄 Once you have tokens, test the connection and get customer data

## Next Steps to Get Customer Data

### 1. Complete OAuth 2.0 Flow

The test script shows you an authorization URL. You need to:

1. **Visit the Authorization URL** (shown when you run `node quickbooks-test.js`)
2. **Sign in to QuickBooks** and authorize your app
3. **Extract the authorization code** from the redirect URL
4. **Exchange the code for tokens** using QuickBooks OAuth API

### 2. Get Access Tokens

After authorizing, you'll get redirected to a URL like:
```
https://developer.intuit.com/v2/OAuth2Playground/RedirectUrl?code=AB11695...&realmId=9130...&state=secureRandomState
```

Extract:
- `code` - Authorization code (exchange this for tokens)
- `realmId` - Company ID (use this as realmId)

### 3. Token Exchange

Make a POST request to exchange the code for tokens:

```bash
curl -X POST \
  https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=authorization_code&code=YOUR_CODE&redirect_uri=https://developer.intuit.com/v2/OAuth2Playground/RedirectUrl' \
  -u 'YOUR_CLIENT_ID:YOUR_CLIENT_SECRET'
```

This returns:
```json
{
  "access_token": "eyJlbmMiOiJBMTI4Q0JD...",
  "refresh_token": "AB11695744021lPp7EFdoQr3...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### 4. Update Test File

Edit `quickbooks-test.js` and update the tokens:

```javascript
const tokens = {
  accessToken: 'eyJlbmMiOiJBMTI4Q0JD...',  // From token exchange
  refreshToken: 'AB11695744021lPp7EFdoQr3...', // From token exchange
  realmId: '9130356350539583'  // From authorization redirect
};
```

### 5. Test Customer Retrieval

Run the test again:

```bash
node quickbooks-test.js
```

Now it should:
- ✅ Connect to QuickBooks
- ✅ Get company information
- ✅ Try to get customer with ID 1
- 📋 If no customer with ID 1, show available customers

## Example Output (After OAuth)

```
🚀 QuickBooks API Connection Test

✅ Configuration loaded successfully
   Client ID: ABL8qccvPd...
   Sandbox mode: true

🔧 Step 3: Initializing QuickBooks connection...
✅ QuickBooks initialized

🔍 Step 4: Testing connection...
✅ Connection successful!
   Company: Test Company
   Country: US

👤 Step 5: Getting customer with ID 1...
✅ Customer found:
   Name: Test Customer
   ID: 1
   Active: true
   Email: customer@example.com
   Balance: $0.00
```

## Using in Your Application

Once you have working tokens, you can use the TypeScript connector:

```typescript
import { QuickBooksConnector, QBTokens } from './src/adapters/quickBooks';

const tokens: QBTokens = {
  accessToken: 'your-access-token',
  refreshToken: 'your-refresh-token',
  realmId: 'your-realm-id'
};

const qb = new QuickBooksConnector({ useSandbox: true });
qb.initialize(tokens);

// Get customer with ID 1
const customer = await qb.getCustomer('1');
console.log(customer);
```

## Environment Variables

Your `.env` file already contains:
```env
QB_CLIENT_ID=ABL8qccvPdpBV59Sqv3pKeEvlCMbRbqYOw5V5bP7b4unXHfDoZ
QB_CLIENT_SECRET=G1YiHwaDWVZVG43OlRBAISj8MKbZdXQs0dKw5gMZ
QB_REDIRECT_URI=https://developer.intuit.com/v2/OAuth2Playground/RedirectUrl
```

## Troubleshooting

- **"Customer with ID 1 not found"** - Normal, just means no customer with that ID exists
- **"Connection failed"** - Check your tokens are valid and not expired
- **"Invalid realmId"** - Make sure you're using the realmId from the OAuth redirect
- **Sandbox vs Production** - Make sure your tokens match your sandbox/production setting

## Security Notes

- Never commit actual access tokens to version control
- Tokens expire and need to be refreshed
- Store tokens securely in production
- Use HTTPS for all OAuth redirects

---

**Status**: ✅ Basic integration complete - Ready for OAuth token setup!
