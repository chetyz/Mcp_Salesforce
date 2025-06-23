import { Connection } from 'jsforce';
import * as dotenv from 'dotenv';

dotenv.config();

export async function createSalesforceConnection(): Promise<Connection> {
  const connectionType = process.env.SALESFORCE_CONNECTION_TYPE || 'User_Password';
  
  if (connectionType === 'OAuth_2.0_Client_Credentials') {
    return await createOAuthConnection();
  } else {
    return await createUserPasswordConnection();
  }
}

async function createUserPasswordConnection(): Promise<Connection> {
  const username = process.env.SALESFORCE_USERNAME;
  const password = process.env.SALESFORCE_PASSWORD;
  const token = process.env.SALESFORCE_TOKEN;
  const instanceUrl = process.env.SALESFORCE_INSTANCE_URL || 'https://login.salesforce.com';

  if (!username || !password || !token) {
    throw new Error('Missing required Salesforce credentials: SALESFORCE_USERNAME, SALESFORCE_PASSWORD, SALESFORCE_TOKEN');
  }

  const conn = new Connection({
    loginUrl: instanceUrl
  });

  await conn.login(username, password + token);
  return conn;
}

async function createOAuthConnection(): Promise<Connection> {
  const clientId = process.env.SALESFORCE_CLIENT_ID;
  const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
  const instanceUrl = process.env.SALESFORCE_INSTANCE_URL;

  if (!clientId || !clientSecret || !instanceUrl) {
    throw new Error('Missing required OAuth credentials: SALESFORCE_CLIENT_ID, SALESFORCE_CLIENT_SECRET, SALESFORCE_INSTANCE_URL');
  }

  const conn = new Connection({
    oauth2: {
      clientId,
      clientSecret,
      redirectUri: 'http://localhost:1717/oauth2/callback'
    },
    instanceUrl
  });

  // Use client credentials flow
  const tokenUrl = `${instanceUrl}/services/oauth2/token`;
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret
    })
  });

  if (!response.ok) {
    throw new Error(`OAuth authentication failed: ${response.statusText}`);
  }

  const tokenData = await response.json();
  conn.initialize({
    instanceUrl: tokenData.instance_url,
    accessToken: tokenData.access_token
  });

  return conn;
}