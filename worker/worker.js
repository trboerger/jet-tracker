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

    // Try fetching up to 3 times
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const response = await fetch('https://opensky-network.org/api/states/all', {
          headers: {
            'User-Agent': 'JetTracker/1.0',
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeout);

        if (!response.ok) {
          // If 429 (rate limited), wait and retry
          if (response.status === 429 && attempt < 3) {
            await new Promise(r => setTimeout(r, 2000 * attempt));
            continue;
          }
          
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
          },
        });
      } catch (error) {
        // If timeout and not last attempt, retry
        if (error.name === 'AbortError' && attempt < 3) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
          continue;
        }
        
        // Final error
        return new Response(JSON.stringify({ 
          error: error.message || 'Fetch failed',
          states: []
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        });
      }
    }
  },
};
