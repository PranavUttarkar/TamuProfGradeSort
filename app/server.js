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


    const gradesUrl = `https://anex.us/grades/?dept=${dept.toUpperCase()}&number=${number}`;
    const catalogUrl = `https://catalog.tamu.edu/undergraduate/course-descriptions/${dept.toLowerCase()}/`;
    const catalogUrlGrad = `https://catalog.tamu.edu/graduate/course-descriptions/${dept.toLowerCase()}/`;


    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            timeout: 50000
        });


        const page = await browser.newPage();


        // Scrape grades data
        console.log("Scraping grades data for ", dept, number);
        await page.goto(gradesUrl, { waitUntil: "domcontentloaded", timeout: 100000 });
        await page.waitForSelector("#dataTable", { timeout: 100000 });
        await page.waitForFunction(() => {
            const tbody = document.querySelector("#dataTable tbody");
            return tbody && tbody.children.length > 0;
        }, { timeout: 100000 });


        const tableData = await page.evaluate(() => {
            const table = document.querySelector("#dataTable");
            if (!table) return [];


            const rows = Array.from(table.querySelectorAll("thead tr, tbody tr"));
            return rows.map(row =>
                Array.from(row.querySelectorAll("th, td")).map(cell => cell.innerText.trim())
            );
        });


        // Scrape catalog data
        console.log("Scraping catalog data...");
        if (number <= 500) {
        await page.goto(catalogUrl, { waitUntil: "domcontentloaded", timeout: 100000 });}
        else {
            await page.goto(catalogUrlGrad, { waitUntil: "domcontentloaded", timeout: 100000 });
        }
        await page.waitForSelector("#sc_sccoursedescs", { timeout: 100000 });
console.log("Waiting for catalog data to load...");
page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

        const catalogData = await page.evaluate((number) => {
            const h2Tags = Array.from(document.querySelectorAll("h2"));
            let courseDescription = null;
            let prerequisites = null;
console.log("Searching for course description and prerequisites...");

            for (const h2 of h2Tags) {
                if (h2.textContent.includes(number)) {
                    const nextParagraph = h2.nextElementSibling;
                    if (nextParagraph && nextParagraph.tagName.toLowerCase() === "p") {
                        const paragraphText = nextParagraph.innerHTML;
                        if (paragraphText.toLowerCase().includes("prerequisite")) {
                            prerequisites = paragraphText ;
                            console.log("Prerequisites:", prerequisites);
                        }
                        else{
                            prerequisites = paragraphText + "No Prerequisites!";
                            console.log("Prerequisites:", prerequisites);
                         
                        }
                        courseDescription = h2.textContent;
                        console.log("Course Description:", courseDescription);
                    }
                    break;
                }
            }
            return { courseDescription, prerequisites };
        }, number);


        await browser.close();

console.log("courseDescription:", catalogData.courseDescription);
        console.log("prerequisites:", catalogData.prerequisites);
        res.json({
            dept,
            number,
            tableData: tableData.length > 0 ? tableData : "No data found in the table.",
            catalogData
        });
    } catch (error) {
        console.error("Error scraping:", error);
        res.status(500).json({ error: "Failed to scrape data. is the Course Code correct? If buggin Please click the report a bug Button!" });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


