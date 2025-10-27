// Serverless API for Vercel to scrape TAMU grade distributions and catalog info
// Uses puppeteer-core with @sparticuz/chromium for Lambda-compatible Chromium

const chromium = require("@sparticuz/chromium");
const puppeteerCore = require("puppeteer-core");

// Lazily load full Puppeteer for local dev where @sparticuz/chromium is not available
let puppeteerFull = null;
try {
  // This will be used in local dev (Windows/macOS/Linux) outside of serverless
  // and is already listed in package.json dependencies
  puppeteerFull = require("puppeteer");
} catch (_) {}

async function launchBrowser() {
  const isServerless = !!(
    process.env.AWS_EXECUTION_ENV ||
    process.env.AWS_REGION ||
    process.env.VERCEL
  );

  // If running in Vercel/AWS Lambda, use @sparticuz/chromium with puppeteer-core
  if (isServerless) {
    const executablePath = await chromium.executablePath();
    return puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
  }

  // Local dev fallback: use full Puppeteer (downloads its own Chromium)
  if (!puppeteerFull) {
    throw new Error(
      "Puppeteer (full) is not available locally. Run: npm install"
    );
  }
  return puppeteerFull.launch({
    headless: true,
    ignoreHTTPSErrors: true,
  });
}

async function scrape(dept, number) {
  if (!dept || !number) {
    throw new Error("Please provide department and course number.");
  }

  const gradesUrl = `https://anex.us/grades/?dept=${dept.toUpperCase()}&number=${number}`;
  const catalogUrl = `https://catalog.tamu.edu/undergraduate/course-descriptions/${dept.toLowerCase()}/`;
  const catalogUrlGrad = `https://catalog.tamu.edu/graduate/course-descriptions/${dept.toLowerCase()}/`;

  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();

    // Scrape grades table
    await page.goto(gradesUrl, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForSelector("#dataTable", { timeout: 30000 });
    await page.waitForFunction(
      () => {
        const tbody = document.querySelector("#dataTable tbody");
        return tbody && tbody.children.length > 0;
      },
      { timeout: 20000 }
    );

    const tableData = await page.evaluate(() => {
      const table = document.querySelector("#dataTable");
      if (!table) return [];
      const rows = Array.from(table.querySelectorAll("thead tr, tbody tr"));
      return rows.map((row) =>
        Array.from(row.querySelectorAll("th, td")).map((cell) =>
          cell.innerText.trim()
        )
      );
    });

    // Scrape catalog data (undergrad vs grad)
    const isUndergrad = Number(number) <= 500;
    await page.goto(isUndergrad ? catalogUrl : catalogUrlGrad, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    // Some dept pages might render slowly; don't fail hard on selector
    await page
      .waitForSelector("#sc_sccoursedescs", { timeout: 20000 })
      .catch(() => {});

    const catalogData = await page.evaluate((courseNumber) => {
      const h2Tags = Array.from(document.querySelectorAll("h2"));
      let courseDescription = null;
      let prerequisites = null;
      for (const h2 of h2Tags) {
        if (h2.textContent && h2.textContent.includes(courseNumber)) {
          const nextParagraph = h2.nextElementSibling;
          if (nextParagraph && nextParagraph.tagName.toLowerCase() === "p") {
            const paragraphText = nextParagraph.innerHTML;
            if (paragraphText.toLowerCase().includes("prerequisite")) {
              prerequisites = paragraphText;
            } else {
              prerequisites = paragraphText + "No Prerequisites!";
            }
            courseDescription = h2.textContent;
          }
          break;
        }
      }
      return { courseDescription, prerequisites };
    }, String(number));

    return {
      dept,
      number,
      tableData:
        tableData.length > 0 ? tableData : "No data found in the table.",
      catalogData,
    };
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (_) {}
    }
  }
}

module.exports = async function handler(req, res) {
  // Support both GET with query and POST with JSON
  const method = req.method || "GET";
  try {
    let dept, number;
    if (method === "POST") {
      ({ dept, number } = req.body || {});
    } else {
      ({ dept, number } = req.query || {});
    }
    const data = await scrape(dept, number);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to scrape data." });
  }
};
