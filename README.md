# WhaleWisdom Holdings Scraper

A Node.js script to scrape holdings data from WhaleWisdom using Puppeteer with proxy support and anti-detection measures.

## Features
- Proxy support (SOCKS5 via Dante or Tor)
- Random user agent rotation
- Rate limiting with random delays
- Pagination handling
- CSV output
- Detailed console logging
- Error handling and retries

## Installation
```bash
npm install
```

## Usage
```bash
node scraper.js
```

## Proxy Configuration
By default, the script is set to use a SOCKS5 proxy via **Dante** or **Tor**. If you want to **run without a proxy (use your IP)**, modify the `PROXY` variable in the script:

```javascript
const PROXY = "--proxy-server=socks5://127.0.0.1:9050"; // Dante proxy
```
**Replace with an empty string** to use your own IP:
```javascript
const PROXY = ""; // Access without proxy
```

## Output
Creates `holdings.csv` with fields:
- Stock (Ticker + Name)
- Sector
- Shares Held
- Market Value
- Portfolio %
- Change in Shares
- Other position details

## Requirements
- Node.js 14+
- Working proxy server (Dante or Tor)
- Internet connection

## Dependencies
- `puppeteer`
- `csv-writer`

## Troubleshooting
If Puppeteer is unable to connect through the proxy:
1. **Ensure Dante is running:**
   ```bash
   sudo systemctl status danted
   ```
2. **Test proxy with cURL:**
   ```bash
   curl -x socks5h://username:password@localhost:1080 https://www.google.com/
   ```
3. **Check firewall settings:** Ensure the proxy port (e.g., 1080) is open.
4. **Try Tor as an alternative SOCKS5 proxy:**
   ```bash
   sudo apt install tor -y
   sudo systemctl start tor
   sudo systemctl enable tor
   ```
   Then, update the proxy setting:
   ```javascript
   const PROXY = "--proxy-server=socks5://127.0.0.1:9050";
   ```

🚀 **Now you're ready to scrape WhaleWisdom data efficiently!**

