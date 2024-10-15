const puppeteer = require('puppeteer');
const assert = require('assert');

async function scrapeGoogleReview(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    // Wait for the review elements to load
    await page.waitForSelector("div[data-snf='nke7rc']", {timeout: 60000});

    // Scrape the review data
    const reviewData = await page.evaluate(() => {
        const reviewElement = document.querySelector("div[data-snf='nke7rc'] div");
        return reviewElement ? reviewElement.innerText : null;
    });

    await browser.close();
    return reviewData;
}

async function testScrapeGoogleReview() {
    const url = 'https://www.google.com/search?q=casa+del+camba'; 
    const expectedReview = `Desde 1986 atendiendo con menú de comida típica y carnes a la parrilla. Amplias cabañas pensadas para atender a todo cruceño, boliviano o extranjeros que nos ...`; 

    const scrapedReview = await scrapeGoogleReview(url);

    // Assert that the scraped review matches the expected review
    assert.equal(scrapedReview.trim(), expectedReview.trim(), 'The scraped review does not match the expected review');

    console.log('All tests passed!');
}

testScrapeGoogleReview().catch(err => console.error('Test failed:', err));