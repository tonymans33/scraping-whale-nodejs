# WhaleWisdom Holdings Scraper

A Node.js script to scrape holdings data from WhaleWisdom using Puppeteer with proxy support and anti-detection measures.

## Features
- Proxy support
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
- Working proxy server
- Internet connection

## Dependencies
- puppeteer
- csv-writer
