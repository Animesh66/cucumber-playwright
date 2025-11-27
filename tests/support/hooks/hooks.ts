import { Before, After, BeforeAll, AfterAll } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { BrowserManager } from "../helpers/browserManager";

BeforeAll(async () => {
  await BrowserManager.launchBrowser();
});

AfterAll(async () => {
  await BrowserManager.closeBrowser();
});

Before(async function () {
  const browser = BrowserManager.getBrowser();
  this.page = await browser.newPage();
  this.log('Navigating to home page');
  await this.page.goto('https://demowebshop.tricentis.com/');
  await expect(this.page).toHaveTitle('Demo Web Shop');
  this.log('On home page');
});

After(async function () {
  await this.page.close();
});