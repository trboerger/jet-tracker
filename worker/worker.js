// Cloudflare Worker - Jet Tracker API Proxy
// This fetches OpenSky data without CORS issues

export default {
  async fetch(request, env) {
    // CORS headers for browser access
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Fetch from OpenSky
      const openSkyUrl = 'https://opensky-network.org/api/states/all';
      
      const response = await fetch(openSkyUrl, {
        headers: {
          'User-Agent': 'JetTracker/1.0 (Research Project)',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`OpenSky error: ${response.status}`);
      }

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=10' // Cache for 10 seconds
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: error.message,
        states: []
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }
  },
};
