/**
 * QuickBooks OAuth Flow Demo - TypeScript
 * 
 * This script demonstrates the complete OAuth 2.0 flow for QuickBooks integration.
 * It can be compiled with TypeScript and run with Node.js.
 * 
 * Usage:
 *   npx tsc src/scripts/quickBooksAuthFlow.ts --outDir dist --moduleResolution node
 *   node dist/scripts/quickBooksAuthFlow.js
 */

import { QuickBooksConnector, QBTokens, QBConfig } from '../adapters/quickBooks';
import * as readline from 'readline';

// Interface for OAuth exchange response
interface OAuthTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

class QuickBooksAuthFlow {
  private qbConnector: QuickBooksConnector;
  private rl: readline.Interface;

  constructor() {
    // Initialize with production settings for real data
    const config: Partial<QBConfig> = {
      useSandbox: false,  // Set to false for production QuickBooks
      debug: true
    };
    
    this.qbConnector = new QuickBooksConnector(config);
    
    // Setup readline for user input
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Main flow orchestrator
   */
  public async runAuthFlow(): Promise<void> {
    console.log('🚀 QuickBooks OAuth 2.0 Flow Demo\n');

    try {
      // Step 1: Show authorization URL
      await this.showAuthorizationStep();
      
      // Step 2: Get authorization code from user
      const authCode = await this.getAuthorizationCode();
      
      // Step 3: Get realm ID from user
      const realmId = await this.getRealmId();
      
      // Step 4: Exchange code for tokens (simulated)
      const tokens = await this.exchangeCodeForTokens(authCode, realmId);
      
      // Step 5: Test the connection
      await this.testConnection(tokens);
      
      // Step 6: Demo customer operations
      await this.demoCustomerOperations(tokens);
      
    } catch (error) {
      console.error('❌ Error in auth flow:', error instanceof Error ? error.message : error);
    } finally {
      this.rl.close();
    }
  }

  /**
   * Step 1: Display authorization URL and instructions
   */
  private async showAuthorizationStep(): Promise<void> {
    console.log('📋 Step 1: Authorization URL Generation');
    console.log('=====================================\n');
    
    const authUrl = this.qbConnector.getAuthorizationUrl('demo-state-123');
    
    console.log('✅ Authorization URL generated successfully!');
    console.log('🔗 Please visit this URL to authorize the application:\n');
    console.log(authUrl);
    console.log('\n📝 Instructions:');
    console.log('1. Click the URL above or copy-paste it into your browser');
    console.log('2. Sign in to your QuickBooks Sandbox account');
    console.log('3. Select a company and authorize the application');
    console.log('4. You will be redirected to a URL containing authorization code and realmId');
    console.log('\nThe redirect URL will look like:');
    console.log('https://developer.intuit.com/v2/OAuth2Playground/RedirectUrl?code=AB11695...&realmId=9130...&state=demo-state-123\n');
    
    await this.waitForUserInput('Press Enter when you have completed the authorization...');
  }

  /**
   * Step 2: Get authorization code from user
   */
  private async getAuthorizationCode(): Promise<string> {
    console.log('\n📋 Step 2: Authorization Code');
    console.log('=============================\n');
    
    console.log('From the redirect URL, copy the "code" parameter value.');
    console.log('Example: If the URL is:');
    console.log('https://developer.intuit.com/v2/OAuth2Playground/RedirectUrl?code=AB11695744021hJJjjOaI&realmId=9130356350539583');
    console.log('Then the authorization code is: AB11695744021hJJjjOaI\n');
    
    const authCode = await this.getUserInput('Enter the authorization code: ');
    
    if (!authCode || authCode.length < 10) {
      throw new Error('Invalid authorization code. Please check and try again.');
    }
    
    console.log('✅ Authorization code received\n');
    return authCode.trim();
  }

  /**
   * Step 3: Get realm ID from user
   */
  private async getRealmId(): Promise<string> {
    console.log('📋 Step 3: Realm ID (Company ID)');
    console.log('=================================\n');
    
    console.log('From the same redirect URL, copy the "realmId" parameter value.');
    console.log('This identifies which QuickBooks company you authorized.\n');
    
    const realmId = await this.getUserInput('Enter the realm ID: ');
    
    if (!realmId || realmId.length < 5) {
      throw new Error('Invalid realm ID. Please check and try again.');
    }
    
    console.log('✅ Realm ID received\n');
    return realmId.trim();
  }

  /**
   * Step 4: Exchange authorization code for tokens
   * In a real application, this would make an HTTP POST request to QuickBooks OAuth endpoint
   */
  private async exchangeCodeForTokens(authCode: string, realmId: string): Promise<QBTokens> {
    console.log('📋 Step 4: Token Exchange');
    console.log('=========================\n');
    
    console.log('🔄 In a real application, this step would make an HTTP POST request to:');
    console.log('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer\n');
    
    console.log('📝 The request would include:');
    console.log(`- grant_type: authorization_code`);
    console.log(`- code: ${authCode}`);
    console.log(`- redirect_uri: ${process.env.QB_REDIRECT_URI}`);
    console.log(`- Authorization header with client credentials\n`);
    
    console.log('⚠️  For this demo, please provide the tokens manually.');
    console.log('In production, these would be obtained automatically from the OAuth response.\n');
    
    // Get tokens from user for demo purposes
    const accessToken = await this.getUserInput('Enter the access_token: ');
    const refreshToken = await this.getUserInput('Enter the refresh_token: ');
    
    const tokens: QBTokens = {
      accessToken: accessToken.trim(),
      refreshToken: refreshToken.trim(),
      realmId: realmId
    };
    
    console.log('✅ Tokens configured\n');
    return tokens;
  }

  /**
   * Step 5: Test the connection
   */
  private async testConnection(tokens: QBTokens): Promise<void> {
    console.log('📋 Step 5: Connection Test');
    console.log('==========================\n');
    
    try {
      console.log('🔧 Initializing QuickBooks connection...');
      this.qbConnector.initialize(tokens);
      console.log('✅ QuickBooks connector initialized');
      
      console.log('🔍 Testing connection by getting company info...');
      const companyInfo = await this.qbConnector.getCompanyInfo();
      
      console.log('✅ Connection successful!');
      
      if (companyInfo.QueryResponse && companyInfo.QueryResponse.CompanyInfo) {
        const company = companyInfo.QueryResponse.CompanyInfo[0];
        console.log(`   📊 Company: ${company.CompanyName}`);
        console.log(`   🌍 Country: ${company.Country}`);
        console.log(`   📧 Email: ${company.Email || 'N/A'}`);
      }
      
    } catch (error) {
      console.error('❌ Connection test failed:', error instanceof Error ? error.message : error);
      throw error;
    }
    
    console.log('');
  }

  /**
   * Step 6: Demo customer operations
   */
  private async demoCustomerOperations(tokens: QBTokens): Promise<void> {
    console.log('📋 Step 6: Customer Operations Demo');
    console.log('===================================\n');
    
    try {
      // Try to get customer with ID 1
      console.log('👤 Attempting to get customer with ID 1...');
      
      try {
        const customer = await this.qbConnector.getCustomer('1');
        this.displayCustomer(customer);
      } catch (error) {
        console.log('❌ Customer with ID 1 not found');
        console.log('🔍 Let\'s find all available customers instead...\n');
        
        // Get all customers
        const allCustomers = await this.qbConnector.findCustomers({ limit: 5 });
        this.displayCustomerList(allCustomers);
        
        // If customers exist, get details for the first one
        if (allCustomers.QueryResponse && allCustomers.QueryResponse.Customer && allCustomers.QueryResponse.Customer.length > 0) {
          const firstCustomerId = allCustomers.QueryResponse.Customer[0].Id;
          console.log(`\n👤 Getting details for customer ID ${firstCustomerId}:`);
          const firstCustomer = await this.qbConnector.getCustomer(firstCustomerId);
          this.displayCustomer(firstCustomer);
        }
      }
      
    } catch (error) {
      console.error('❌ Error in customer operations:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Display customer information in a formatted way
   */
  private displayCustomer(customer: any): void {
    console.log('✅ Customer found:');
    console.log(`   📝 Name: ${customer.Name}`);
    console.log(`   🆔 ID: ${customer.Id}`);
    console.log(`   ✅ Active: ${customer.Active}`);
    console.log(`   💰 Balance: $${customer.Balance || '0.00'}`);
    
    if (customer.PrimaryEmailAddr) {
      console.log(`   📧 Email: ${customer.PrimaryEmailAddr.Address}`);
    }
    
    if (customer.PrimaryPhone) {
      console.log(`   📞 Phone: ${customer.PrimaryPhone.FreeFormNumber}`);
    }
    
    if (customer.BillAddr) {
      console.log(`   🏠 Address: ${customer.BillAddr.Line1 || ''} ${customer.BillAddr.City || ''} ${customer.BillAddr.PostalCode || ''}`);
    }
    
    console.log('\n📄 Complete customer object:');
    console.log(JSON.stringify(customer, null, 2));
  }

  /**
   * Display customer list
   */
  private displayCustomerList(customers: any): void {
    if (customers.QueryResponse && customers.QueryResponse.Customer) {
      console.log('📋 Available customers:');
      customers.QueryResponse.Customer.forEach((customer: any, index: number) => {
        console.log(`   ${index + 1}. ${customer.Name} (ID: ${customer.Id}) - Active: ${customer.Active}`);
      });
    } else {
      console.log('ℹ️  No customers found in QuickBooks');
    }
  }

  /**
   * Helper method to get user input
   */
  private getUserInput(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  }

  /**
   * Helper method to wait for user input
   */
  private waitForUserInput(message: string): Promise<void> {
    return new Promise((resolve) => {
      this.rl.question(message, () => {
        resolve();
      });
    });
  }
}

// Export for use in other modules
export { QuickBooksAuthFlow };

// Run if this file is executed directly
if (require.main === module) {
  const authFlow = new QuickBooksAuthFlow();
  authFlow.runAuthFlow()
    .then(() => {
      console.log('\n🎉 QuickBooks OAuth flow demo completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 OAuth flow demo failed:', error);
      process.exit(1);
    });
}
