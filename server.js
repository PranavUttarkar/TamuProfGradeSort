const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serves index.html and assets

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/scrape", async (req, res) => {
    const { dept, number } = req.query;

    if (!dept || !number) {
        return res.status(400).json({ error: "Please provide department and course number." });
    }

    const url = `https://anex.us/grades/?dept=${dept.toUpperCase()}&number=${number}`;

    try {
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 0 });

        await page.waitForSelector("#dataTable", { timeout: 10000 });

        await page.waitForFunction(() => {
            const tbody = document.querySelector("#dataTable tbody");
            return tbody && tbody.children.length > 0;
        }, { timeout: 10000 });

        const tableData = await page.evaluate(() => {
            const table = document.querySelector("#dataTable");
            if (!table) return [];

            const rows = Array.from(table.querySelectorAll("thead tr, tbody tr"));
            return rows.map(row =>
                Array.from(row.querySelectorAll("th, td")).map(cell => cell.innerText.trim())
            );
        });

        await browser.close();

        if (tableData.length === 0) {
            return res.json({ error: "No data found in the table." });
        }

        res.json({ dept, number, tableData });
    } catch (error) {
        console.error("Error scraping:", error);
        res.status(500).json({ error: "Failed to scrape data." });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
