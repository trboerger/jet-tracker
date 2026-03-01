export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Try to fetch from OpenSky
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch('https://opensky-network.org/api/states/all', {
        method: 'GET',
        headers: {
          'User-Agent': 'JetTracker/1.0',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeout);

      if (!response.ok) {
        return new Response(JSON.stringify({ 
          error: `OpenSky returned ${response.status}`,
          states: []
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        });
      }

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=5',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: error.message || 'Worker error',
        states: []
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }
  },
};
