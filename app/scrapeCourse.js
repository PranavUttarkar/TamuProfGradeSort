const puppeteer = require("puppeteer");

/**
 * Scrape course grade distribution and catalog data.
 * @param {string} dept Department code (e.g. CSCE)
 * @param {string|number} number Course number (e.g. 221)
 * @returns {Promise<{dept:string, number:string|number, tableData:string[][]|string, catalogData:{courseDescription:string|null, prerequisites:string|null}}>}
 */
async function scrapeCourse(dept, number) {
  if (!dept || !number) {
    throw new Error("Please provide department and course number.");
  }

  const gradesUrl = `https://anex.us/grades/?dept=${dept.toUpperCase()}&number=${number}`;
  const catalogUrl = `https://catalog.tamu.edu/undergraduate/course-descriptions/${dept.toLowerCase()}/`;
  const catalogUrlGrad = `https://catalog.tamu.edu/graduate/course-descriptions/${dept.toLowerCase()}/`;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      timeout: 90000,
    });

    const page = await browser.newPage();

    // Scrape grades data
    await page.goto(gradesUrl, {
      waitUntil: "domcontentloaded",
      timeout: 100000,
    });
    await page.waitForSelector("#dataTable", { timeout: 100000 });
    await page.waitForFunction(
      () => {
        const tbody = document.querySelector("#dataTable tbody");
        return tbody && tbody.children.length > 0;
      },
      { timeout: 100000 }
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

    // Scrape catalog data
    if (Number(number) <= 500) {
      await page.goto(catalogUrl, {
        waitUntil: "domcontentloaded",
        timeout: 100000,
      });
    } else {
      await page.goto(catalogUrlGrad, {
        waitUntil: "domcontentloaded",
        timeout: 100000,
      });
    }
    await page
      .waitForSelector("#sc_sccoursedescs", { timeout: 100000 })
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
  } catch (err) {
    throw new Error(
      "Failed to scrape data. Is the course code correct? Details: " +
        err.message
    );
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (_) {}
    }
  }
}

module.exports = scrapeCourse;
