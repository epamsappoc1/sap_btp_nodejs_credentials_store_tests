const puppeteer = require("puppeteer");
var pdf = async (html = "") => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(html);

    const pdfBuffer = await page.pdf();

    await page.close();
    await browser.close();

    return pdfBuffer;
  } catch (e) {
    pdf = e;
  }
};
module.exports = pdf;
