import { Before, After, BeforeAll, AfterAll } from "@cucumber/cucumber";
import { chromium, Browser, Page } from "playwright";

let browser: Browser;

BeforeAll(async () => {
  browser = await chromium.launch({ headless: false });
});

AfterAll(async () => {
  await browser.close();
});

Before(async function () {
  this.page = await browser.newPage();
});

After(async function () {
  await this.page.close();
});