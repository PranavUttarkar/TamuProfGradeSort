import puppeteer from 'puppeteer-core';
import chrome from 'chrome-aws-lambda';

const browser = await chromium.puppeteer.launch({
    args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });

export default async function handler(req, res) {
    const { dept, number } = req.query;

    if (!dept || !number) {
        return res.status(400).json({ error: 'Please provide department and course number.' });
    }

    const url = `https://anex.us/grades/?dept=${dept.toUpperCase()}&number=${number}`;
    console.log('Scraping:', url);
    try {
        const browser = await puppeteer.launch({
            executablePath: await chrome.executablePath,
            headless: chrome.headless,
            args: chrome.args,
            defaultViewport: chrome.defaultViewport,
        });
        console.log('Browser launched');

        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 });

        await page.waitForSelector('#dataTable', { timeout: 30000 });

        await page.waitForFunction(() => {
            const tbody = document.querySelector('#dataTable tbody');
            return tbody && tbody.children.length > 0;
        }, { timeout: 30000 });

        const tableData = await page.evaluate(() => {
            const table = document.querySelector('#dataTable');
            if (!table) return [];

            const rows = Array.from(table.querySelectorAll('thead tr, tbody tr'));
            return rows.map(row =>
                Array.from(row.querySelectorAll('th, td')).map(cell => cell.innerText.trim())
            );
        });

        await browser.close();

        if (tableData.length === 0) {
            return res.json({ error: 'No data found in the table.' });
        }

        res.json({ dept, number, tableData });
    } catch (error) {
        console.error('Error scraping:', error);
        res.status(500).json({ error: 'Failed to scrape data.' });
    }
}
