import { Handler } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

// Netlify Functions handler for CRUD over Blobs (users/tasks/templates/orgs)
export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const type = event.queryStringParameters?.type;

  // Health check
  if (type === 'health') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: 'ok', timestamp: Date.now() }),
    };
  }

  const validTypes = ['users', 'tasks', 'templates', 'orgs'];
  if (!type || !validTypes.includes(type)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid or missing type parameter' }),
    };
  }

  try {
    const store = getStore('data');

    if (event.httpMethod === 'GET') {
      const rawData = await store.get(type, { type: 'json' });
      const data = rawData || [];
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    if (event.httpMethod === 'POST') {
      const body = event.body ? JSON.parse(event.body) : null;
      if (body === null) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing body' }) };
      }
      await store.setJSON(type, body);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, count: Array.isArray(body) ? body.length : 1 }),
      };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (error: any) {
    console.error(`Backend Error (${type}):`, error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error?.message || 'Internal Server Error' }),
    };
  }
};
