/**
 * QuickBooks Usage Example - TypeScript
 * 
 * This example shows how to use the QuickBooks connector to get customer information.
 * 
 * USAGE:
 *   npx tsc src/examples/quickBooksExample.ts --outDir dist --moduleResolution node
 *   node dist/examples/quickBooksExample.js
 * 
 * IMPORTANT: Before running this example, you need to:
 * 1. Complete the OAuth 2.0 flow to get access tokens
 * 2. Update the tokens below with your actual values
 * 
 * For a complete OAuth 2.0 flow demo, run:
 *   npx tsc src/scripts/quickBooksAuthFlow.ts --outDir dist --moduleResolution node
 *   node dist/scripts/quickBooksAuthFlow.js
 */

import { QuickBooksConnector, QBTokens, QBConfig } from '../adapters/quickBooks';

export async function quickBooksExample(): Promise<void> {
  console.log('🚀 QuickBooks API Example - Getting Customer Info\n');

  try {
    // Step 1: Create connector instance with proper typing
    const config: Partial<QBConfig> = {
      useSandbox: false, // Set to false for production QuickBooks
      debug: true        // Set to false to reduce logging
    };
    
    const qbConnector = new QuickBooksConnector(config);

    // Step 2: Get OAuth authorization URL (run this first)
    const authUrl = qbConnector.getAuthorizationUrl('example-state');
    console.log('🔗 Authorization URL:');
    console.log(authUrl);
    console.log('\n📝 Instructions:');
    console.log('1. Visit the URL above in your browser');
    console.log('2. Sign in to QuickBooks and authorize the app');
    console.log('3. Copy the authorization code from the redirect URL');
    console.log('4. Exchange the code for access tokens using QuickBooks OAuth API');
    console.log('5. Update the tokens below and run this example again');
    console.log('\n💡 For a complete interactive OAuth flow, run the auth flow script instead:\n');
    console.log('   npx tsc src/scripts/quickBooksAuthFlow.ts --outDir dist --moduleResolution node');
    console.log('   node dist/scripts/quickBooksAuthFlow.js\n');

    // Step 3: Initialize with OAuth tokens (replace with your actual tokens)
    const tokens: QBTokens = {
      accessToken: 'your-access-token',      // Replace with actual access token
      refreshToken: 'your-refresh-token',    // Replace with actual refresh token  
      realmId: 'your-realm-id'               // Replace with actual company/realm ID
    };

    // Only proceed if we have real tokens
    if (tokens.accessToken !== 'your-access-token') {
      qbConnector.initialize(tokens);

      // Step 4: Test the connection
      console.log('🔍 Testing QuickBooks connection...');
      const isConnected = await qbConnector.testConnection();
      
      if (isConnected) {
        console.log('✅ Connected to QuickBooks successfully!\n');

        // Step 5: Get customer with ID 1
        console.log('👤 Attempting to get customer with ID 1...');
        try {
          const customer = await qbConnector.getCustomer('1');
          console.log('✅ Customer found:');
          console.log(`   Name: ${customer.Name}`);
          console.log(`   ID: ${customer.Id}`);
          console.log(`   Balance: ${customer.Balance || 0}`);
          console.log(`   Email: ${customer.PrimaryEmailAddr?.Address || 'N/A'}`);
          console.log('\n📄 Full customer object:');
          console.log(JSON.stringify(customer, null, 2));
        } catch (error) {
          console.log('❌ Customer with ID 1 not found');
          console.log('🔍 Let\'s try to find all customers instead...\n');
          
          // Alternative: Get all customers
          const allCustomers = await qbConnector.findCustomers({ limit: 5 });
          if (allCustomers.QueryResponse && allCustomers.QueryResponse.Customer) {
            console.log('📋 Found customers:');
            allCustomers.QueryResponse.Customer.forEach((customer: any, index: number) => {
              console.log(`   ${index + 1}. ${customer.Name} (ID: ${customer.Id})`);
            });
          } else {
            console.log('No customers found in QuickBooks');
          }
        }
      } else {
        console.log('❌ Failed to connect to QuickBooks');
        console.log('   Please check your tokens and network connection');
      }
    } else {
      console.log('⚠️  Please update the tokens in this file with your actual OAuth tokens');
      console.log('    Or use the interactive auth flow script for a complete demo.');
    }

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

// Helper function to get a specific customer with proper typing
export async function getSpecificCustomer(customerId: string, tokens: QBTokens): Promise<any> {
  const config: Partial<QBConfig> = { useSandbox: true };
  const qbConnector = new QuickBooksConnector(config);
  qbConnector.initialize(tokens);
  return await qbConnector.getCustomer(customerId);
}

// Helper function to get customer with error handling
export async function safeGetCustomer(customerId: string, tokens: QBTokens): Promise<any | null> {
  try {
    return await getSpecificCustomer(customerId, tokens);
  } catch (error) {
    console.error(`Failed to get customer ${customerId}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

// Run example if this file is executed directly
if (require.main === module) {
  quickBooksExample();
}
