# Jet Tracker

A real-time dashboard for tracking private jets of billionaires, tech CEOs, and government aircraft. Built with Next.js, React, Leaflet maps, and the OpenSky Network ADS-B API.

![Jet Tracker Screenshot](screenshot.png)

## Features

- **Real-time tracking** of 40+ high-profile aircraft
- **Interactive map** with live positions
- **Categories**: Tech CEOs, Business moguls, Political figures, Government/Military
- **Live stats**: Altitude, speed, heading, callsign
- **Auto-refresh** every 30 seconds
- **Responsive design** for desktop and mobile

### Tracked Aircraft

#### Tech Billionaires
- Elon Musk (Gulfstream G650ER)
- Jeff Bezos (Gulfstream G650ER)
- Mark Zuckerberg (Gulfstream G650)
- Bill Gates (Bombardier Global 7500)
- Larry Ellison (Gulfstream G650ER)
- Larry Page & Sergey Brin (Gulfstream G650)
- Tim Cook (Dassault Falcon 7X)
- Jensen Huang (Gulfstream G650ER)

#### Business & Finance
- Warren Buffett
- Michael Bloomberg
- Ken Griffin
- Carl Icahn
- Stephen Schwarzman
- Jamie Dimon
- Ray Dalio

#### Political
- Donald Trump (Trump Force One)

#### Government/Military
- Air Force One (VC-25A)
- Air Force Two (C-32A)
- E-4B Doomsday Plane
- E-6B Mercury (Looking Glass)
- RC-135 Rivet Joint (SIGINT)
- P-8 Poseidon (Maritime patrol)
- U-2 Dragon Lady (Reconnaissance)
- WC-135 Nuclear Sniffer
- And more...

## Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/jet-tracker)

### Manual Deploy

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

Or simply drag and drop the project folder into Vercel's dashboard.

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## How It Works

1. **ADS-B Data**: Aircraft broadcast their position, altitude, speed, and other data via transponders
2. **OpenSky Network**: A community of volunteers receives these signals and aggregates them
3. **This App**: Queries OpenSky's API for specific aircraft ICAO24 identifiers
4. **Real-time Updates**: Automatically refreshes every 30 seconds

## Limitations

- **Coverage**: Only works where ADS-B receivers exist (mostly populated areas)
- **Military/Government**: Many military aircraft don't broadcast or use encrypted transponders
- **Rate Limits**: OpenSky has rate limits for anonymous users
- **Altitude**: Aircraft below 1000ft or on ground may not appear

## Aircraft Identifiers

Aircraft are tracked by their ICAO24 hex transponder code. These are public identifiers 
broadcast by all aircraft. The codes in this app are based on public ADS-B tracking 
communities and may change if aircraft are sold or re-registered.

## Disclaimer

This project is for **entertainment and educational purposes only**. 
- Not for navigation
- Not for security or safety decisions
- Data accuracy not guaranteed
- Respect aircraft owners' privacy

## License

MIT License - Feel free to fork and modify!
