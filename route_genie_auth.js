// auth.js
require('dotenv').config();
const axios = require('axios');
const qs = require('qs');

async function getAccessToken() {
  const { RG_HOST, RG_CLIENT_ID, RG_CLIENT_SECRET } = process.env;

  // Build the Basic auth header
  //   base64.b64encode(credential.encode("utf-8"))
  const credentials = Buffer.from(`${RG_CLIENT_ID}:${RG_CLIENT_SECRET}`).toString('base64');
  console.log('Using Authorization:', `Basic ${credentials}`);

  // Body for client_credentials grant
  const body = qs.stringify({ grant_type: 'client_credentials' });

  try {
    const response = await axios.post(
      `${RG_HOST}/oauth2/token/`,
      body,
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, expires_in, token_type } = response.data;
    console.log('🎉 Access Token:', access_token);
    console.log('⏳ Expires In (s):', expires_in);
    console.log('🔑 Token Type:', token_type);
    return access_token;

  } catch (err) {
    console.error('❌ Failed to fetch access token:', err.response?.data, " | ", err.message);
    throw err;
  }
}

// If run directly, grab a token
if (require.main === module) {
  getAccessToken();
}

module.exports = getAccessToken;
