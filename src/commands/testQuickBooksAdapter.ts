import readline from 'readline';
import { QuickBooksAdapter } from '../adapters/quickBooks';

async function main() {
  const adapter = new QuickBooksAdapter();

  // 1) Show auth URL
  const state = Math.random().toString(36).substring(2);
  console.log('Visit this URL in your browser and authorize:\n', adapter.getAuthUrl(state), '\n');

  // 2) pull code/realmId from args or env
  const [, , argCode, argRealm] = process.argv;
  const code  = argCode || process.env.QB_CODE;
  const realm = argRealm || process.env.QB_REALM_ID;

  // 3) if still missing, prompt interactively
  let finalCode = code;
  let finalRealm = realm;
  if (!code || !realm) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (q: string) => new Promise<string>(res => rl.question(q, res));
    finalCode  = finalCode  || await question('Enter the "code" from redirect URL: ');
    finalRealm = finalRealm || await question('Enter the "realmId" from redirect URL: ');
    rl.close();
  }

  // 4) exchange & call API
  const client = await adapter.createClient(finalCode!.trim(), finalRealm!.trim());
  client.findAccounts((err, resp) => {
    if (err) return console.error('API error:', err);
    console.log('Accounts returned:', resp.QueryResponse.Account);
  });
}

main().catch(err => console.error(err));
