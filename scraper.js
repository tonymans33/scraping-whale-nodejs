const puppeteer = require("puppeteer");
const csvWriter = require("csv-writer").createObjectCsvWriter;

const PROXY = "--proxy-server=socks5://127.0.0.1:9050"; // Dante proxy

/**
 * Generates a random user-agent for the scraper.
 */
const getRandomUserAgent = () => {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};

/**
 * Introduces a random delay to mimic human behavior and avoid detection.
 */
const randomDelay = async (min, max) => {
  const delay = Math.floor(Math.random() * (max - min + 1) + min);
  console.log(`Waiting ${delay}ms before next action...`);
  await new Promise((resolve) => setTimeout(resolve, delay));
};

/**
 * Scrolls to the bottom of the page to reveal the "Next Page" button.
 */
const scrollToBottom = async (page) => {
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  console.log("Scrolled to the bottom of the page.");
  await randomDelay(2000, 4000); // Wait for elements to load
};

/**
 * Extracts data from the holdings table on the current page.
 */
const extractTableData = async (page) => {
  return await page.evaluate(() => {
    return Array.from(
      document.querySelectorAll("div.v-data-table table tbody tr")
    ).map((row) => {
      const columns = row.querySelectorAll("td");
      const stockTicker = columns[0]?.innerText.trim() || "";
      const hoverElement = columns[0]?.querySelector("a[title]"); // Extract hover text
      const stockName = hoverElement ? hoverElement.getAttribute("title") : "";
      const stockFull = stockName
        ? `${stockTicker} "${stockName}"`
        : stockTicker;

      return {
        stock: stockFull,
        history: columns[1]?.innerText.trim() || "",
        sector: columns[2]?.innerText.trim() || "",
        sharesHeld: columns[3]?.innerText.trim() || "",
        marketValue: columns[4]?.innerText.trim() || "",
        percentPortfolio: columns[5]?.innerText.trim() || "",
        previousPercentPortfolio: columns[6]?.innerText.trim() || "",
        rank: columns[7]?.innerText.trim() || "",
        changeInShares: columns[8]?.innerText.trim() || "",
        percentChange: columns[9]?.innerText.trim() || "",
        percentOwnership: columns[10]?.innerText.trim() || "",
        qtrFirstOwned: columns[11]?.innerText.trim() || "",
        estAvgPrice: columns[12]?.innerText.trim() || "",
        qtrEndPrice: columns[13]?.innerText.trim() || "",
        price1D: columns[14]?.innerText.trim() || "",
        perfMTD: columns[15]?.innerText.trim() || "",
        perfYTD: columns[16]?.innerText.trim() || "",
        source: columns[17]?.innerText.trim() || "",
        sourceDate: columns[18]?.innerText.trim() || "",
        dateReported: columns[19]?.innerText.trim() || "",
      };
    });
  });
};

/**
 * Scrapes the holdings data across multiple pages.
 */
const scrapeTable = async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    headless: false,
    args: [PROXY, "--no-sandbox"],
  });
  const page = await browser.newPage();

  console.log("Configuring browser settings...");
  await page.setUserAgent(getRandomUserAgent());

  console.log("Navigating to WhaleWisdom...");
  await page.goto("https://whalewisdom.com/filer/berkshire-hathaway-inc", {
    waitUntil: "networkidle2",
  });

  console.log('Waiting for the "Holdings" tab...');
  try {
    await page.waitForSelector("div.v-tab", { timeout: 60000 });
    const tabs = await page.$$("div.v-tab");

    for (const tab of tabs) {
      const tabText = await page.evaluate((el) => el.textContent.trim(), tab);
      if (tabText === "Holdings") {
        console.log('Found the "Holdings" tab. Clicking it...');
        await tab.click();
        await randomDelay(4000, 7000);
        break;
      }
    }
  } catch (error) {
    console.error("Error: Could not find or click Holdings tab.", error);
    await browser.close();
    throw error;
  }

  console.log("Waiting for table to load...");
  await page.waitForSelector("div.v-data-table table tbody tr", {
    timeout: 60000,
  });

  let allData = [];
  let pageNumber = 1;
  let previousRowCount = 0;

  while (true) {
    console.log(`Extracting data from page ${pageNumber}...`);

    await scrollToBottom(page); // Ensure the "Next Page" button is visible
    const pageData = await extractTableData(page);

    console.log(`Extracted ${pageData.length} rows.`);
    allData = allData.concat(pageData);

    // Stop if the number of extracted rows doesn't increase
    if (allData.length === previousRowCount) {
      console.log("No new data loaded. Assuming this is the last page.");
      break;
    }
    previousRowCount = allData.length;

    // Check if the Next Page button is disabled
    const nextButtonDisabled = await page.evaluate(() => {
      const nextButton = document.querySelector(
        "button[aria-label='Next page']"
      );
      return !nextButton || nextButton.disabled;
    });

    if (nextButtonDisabled) {
      console.log("No more pages left. Exiting loop.");
      break;
    }

    console.log("Navigating to next page...");
    await page.click("button[aria-label='Next page']");
    await randomDelay(5000, 10000);

    pageNumber++;
  }

  console.log(`Total rows extracted: ${allData.length}`);

  // Filter valid stock rows
  const isValidStockRow = (row) =>
    /^[A-Z.]+$/.test(row.stock.split(" ")[0]) && row.sector && row.sharesHeld;
  const filteredData = allData.filter(isValidStockRow);

  console.log(`Valid rows after filtering: ${filteredData.length}`);

  await browser.close();
  console.log("Browser closed.");

  return filteredData;
};

/**
 * Writes the extracted data to a CSV file.
 */
const writeToCSV = async (data) => {
  console.log("Writing data to CSV...");
  const csv = csvWriter({
    path: "holdings.csv",
    header: Object.keys(data[0]).map((key) => ({ id: key, title: key })),
  });

  await csv.writeRecords(data);
  console.log("CSV file written successfully.");
};

/**
 * Main function to control execution.
 */
const main = async () => {
  try {
    console.log("Starting scraping process...");
    const tableData = await scrapeTable();
    console.log(`Scraping completed. Valid data length: ${tableData.length}`);

    await writeToCSV(tableData);
    console.log("CSV file successfully created.");
  } catch (error) {
    console.error("Error during scraping process:", error);
  }
};

// Run the scraper
main();
