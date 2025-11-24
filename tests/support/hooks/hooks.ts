import { Before, After, BeforeAll, AfterAll } from "@cucumber/cucumber";
import { chromium, Browser } from "playwright";
import { expect } from "@playwright/test";

let browser: Browser;

BeforeAll(async () => {
  browser = await chromium.launch({ headless: false });
});

AfterAll(async () => {
  await browser.close();
});

Before(async function () {
  this.page = await browser.newPage();
  this.log('Navigating to home page');
  await this.page.goto('https://demowebshop.tricentis.com/');
  await expect(this.page).toHaveTitle('Demo Web Shop');
  this.log('On home page');
});

After(async function () {
  await this.page.close();
});