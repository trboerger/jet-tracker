export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Fetch from OpenSky
      const openSkyUrl = 'https://opensky-network.org/api/states/all';
      const response = await fetch(openSkyUrl, {
        headers: {
          'User-Agent': 'JetTracker/1.0'
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
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }
  },
};
