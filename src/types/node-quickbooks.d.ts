declare module 'node-quickbooks' {
  /** minimal interface for the findAccounts callback shape */
  interface QueryResponse<T> {
    QueryResponse: { Account: T[] };
  }

  export default class QuickBooks {
    /**
     * @param clientId     your app’s client ID
     * @param clientSecret your app’s client secret
     * @param token        access token
     * @param tokenSecret  token secret (false for OAuth2)
     * @param realmId      company ID
     * @param useSandbox   true = sandbox, false = production
     * @param debug        turn on debugging
     * @param minorversion optional minor API version
     * @param oauthversion OAuth version (“2.0”)
     * @param refreshToken optional refresh token
     */
    constructor(
      clientId: string,
      clientSecret: string,
      token: string,
      tokenSecret: false,
      realmId: string,
      useSandbox: boolean,
      debug: boolean,
      minorversion?: number,
      oauthversion?: string,
      refreshToken?: string
    );

    /** example method you’re calling in your code */
    findAccounts(
      callback: (err: any, result: QueryResponse<{ Name: string }>) => void
    ): void;

    // ...add other methods you use here...
  }
}
