# QuickBooks Integration

This module provides a minimal connector for Intuit's QuickBooks API using the `node-quickbooks` library.

## Features

- OAuth 2.0 authentication
- Customer management (get, find, create, update)
- Company information retrieval
- Sandbox and production support
- TypeScript support

## Setup

### 1. Install Dependencies

The `node-quickbooks` package is already installed. If you need to reinstall:

```bash
npm install node-quickbooks
```

### 2. Environment Variables

Ensure your `.env` file contains:

```env
QB_CLIENT_ID=your_quickbooks_client_id
QB_CLIENT_SECRET=your_quickbooks_client_secret
QB_REDIRECT_URI=https://developer.intuit.com/v2/OAuth2Playground/RedirectUrl
```

### 3. OAuth 2.0 Flow

Before you can make API calls, you need to complete the OAuth 2.0 flow:

1. **Get Authorization URL:**
   ```typescript
   import { QuickBooksConnector } from './src/adapters/quickBooks';
   
   const qbConnector = new QuickBooksConnector({ useSandbox: true });
   const authUrl = qbConnector.getAuthorizationUrl();
   console.log('Visit:', authUrl);
   ```

2. **Complete Authorization:**
   - Visit the URL in your browser
   - Sign in to QuickBooks and authorize the app
   - Note the authorization code from the redirect URL

3. **Exchange Code for Tokens:**
   You'll need to make a POST request to exchange the authorization code for access tokens. This is typically done server-side.

## Usage

### Basic Example

```typescript
import { QuickBooksConnector, QBTokens } from './src/adapters/quickBooks';

async function getCustomerExample() {
  // Create connector
  const qbConnector = new QuickBooksConnector({
    useSandbox: true, // Set to false for production
    debug: true
  });

  // Initialize with tokens (obtained from OAuth flow)
  const tokens: QBTokens = {
    accessToken: 'your-access-token',
    refreshToken: 'your-refresh-token',
    realmId: 'your-realm-id'
  };
  
  qbConnector.initialize(tokens);

  try {
    // Get customer with ID 1
    const customer = await qbConnector.getCustomer('1');
    console.log('Customer:', customer);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Available Methods

#### Customer Operations
- `getCustomer(id: string)` - Get customer by ID
- `findCustomers(criteria?)` - Find customers with optional criteria
- `createCustomer(customerData)` - Create new customer
- `updateCustomer(customerData)` - Update existing customer

#### Other Operations
- `getCompanyInfo()` - Get company information
- `testConnection()` - Test if connection is working

### Running Examples

1. **Run the QuickBooks example:**
   ```bash
   npm run start:example
   ```
   
   Or compile and run:
   ```bash
   npx tsc src/examples/quickBooksExample.ts --outDir dist
   node dist/examples/quickBooksExample.js
   ```

2. **Run the test script:**
   ```bash
   npx tsc src/scripts/testQuickBooksConnector.ts --outDir dist
   node dist/scripts/testQuickBooksConnector.js
   ```

## Configuration Options

```typescript
interface QBConfig {
  clientId: string;        // QuickBooks app client ID
  clientSecret: string;    // QuickBooks app client secret
  redirectUri: string;     // OAuth redirect URI
  useSandbox: boolean;     // true for sandbox, false for production
  debug?: boolean;         // Enable debug logging
}
```

## Error Handling

The connector includes comprehensive error handling:

```typescript
try {
  const customer = await qbConnector.getCustomer('1');
} catch (error) {
  if (error.message.includes('not found')) {
    console.log('Customer does not exist');
  } else {
    console.error('API error:', error.message);
  }
}
```

## Sandbox vs Production

- **Sandbox**: Use `useSandbox: true` for testing with QuickBooks Sandbox
- **Production**: Use `useSandbox: false` for live QuickBooks companies

## Security Notes

- Never commit access tokens or refresh tokens to version control
- Store tokens securely (encrypted database, environment variables, etc.)
- Implement token refresh logic for long-running applications
- Use HTTPS for all OAuth redirects in production

## Files

- `src/adapters/quickBooks.ts` - Main connector class
- `src/types/node-quickbooks.d.ts` - TypeScript declarations
- `src/examples/quickBooksExample.ts` - Usage example
- `src/scripts/testQuickBooksConnector.ts` - Test script

## Next Steps

1. Complete OAuth 2.0 flow to get valid tokens
2. Test with your QuickBooks Sandbox account
3. Implement token refresh logic
4. Add additional QuickBooks API operations as needed
5. Move to production when ready
