import QuickBooks from 'node-quickbooks';
import dotenv from 'dotenv';
import { URLSearchParams } from 'url';

dotenv.config();

export interface QuickBooksTokens {
  accessToken: string;
  refreshToken: string;
  realmId?: string;
}

export class QuickBooksAdapter {
  private clientId = process.env.QB_SB_CLIENT_ID!;
  private clientSecret = process.env.QB_SB_CLIENT_SECRET!;
  private redirectUri = process.env.QB_REDIRECT_URI!;
  private sandbox = true;

  /** Returns the URL to redirect your user to for granting access */
  public getAuthUrl(state: string): string {
    const authUrl = new URL('https://appcenter.intuit.com/connect/oauth2');
    authUrl.searchParams.set('client_id', this.clientId);
    authUrl.searchParams.set('redirect_uri', this.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'com.intuit.quickbooks.accounting');
    authUrl.searchParams.set('state', state);
    return authUrl.toString();
  }

  /**
   * Exchange the authorization code for tokens,
   * and return a configured QuickBooks client.
   */
  public async createClient(code: string, realmId: string): Promise<QuickBooks> {
    const tokenUrl = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri, // must match EXACT in your app settings
    });

    const headers = {
      Authorization: 'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    };

    console.debug('TOKEN REQUEST →', { tokenUrl, headers, body: params.toString() });

    const resp = await fetch(tokenUrl, {
      method: 'POST',
      headers,
      body: params.toString(),
    });

    const data = await resp.json() as any;
    if (data.error) {
      console.error('TOKEN RESPONSE ERROR:', data);
      throw new Error(`Intuit token error: ${data.error_description || data.error}`);
    }



    return new QuickBooks(
      this.clientId, 
      this.clientSecret, // your app’s client ID and secret
      data.access_token, // access token
      false,           // OAuth2 has no token secret
      realmId, // company ID (realmId)
      this.sandbox, // use sandbox or production
      true,            // debugging on
      undefined,       // minor version default
      '2.0',      // OAuth version
      data.refresh_token // refresh token
    );
  }
}