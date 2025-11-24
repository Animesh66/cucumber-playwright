import { Given, When, Then, setDefaultTimeout } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

setDefaultTimeout(120000); // setting the default timeout to 120 seconds

Given('I click the login link', async function () {
  this.log('Clicking on login link');
  await this.page.getByRole('link', { name: 'Log in' }).click();
  expect(this.page.url()).toContain('login');
  await expect(this.page).toHaveTitle(/Login/);
  this.log('On login page');
});

When('I enter email as {string} and password {string}', async function (email, password) {
  this.email = email;
  this.password = password;
  await this.page.getByRole('textbox', { name: 'Email' }).fill(email);
  await this.page.getByRole('textbox', { name: 'Password' }).fill(password);
});

When('I click the login button', async function () {
  await this.page.getByRole('button', { name: 'Log in' }).click();
});

Then('I should see my username displayed on the page', async function () {
  await expect(this.page.locator('.header-links .account')).toHaveText(this.email);
});

Then('I should see the logout option in the menu', async function () {
  await expect(this.page.getByRole('link', { name: 'Log out' })).toBeVisible();
});

Then('I should see an error message indicating invalid credentials', async function () {
  const errorMessage = this.page.locator('.message-error .validation-summary-errors');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toHaveText(/The credentials provided are incorrect/);
});