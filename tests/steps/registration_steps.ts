import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

Given('I click on registration page', async function () {  
  this.log('Clicking on registration link');
  await this.page.getByRole('link', { name: 'Register' }).click();
  await expect(this.page).toHaveTitle(/Register/);
  this.log('On registration page');
});

When('I enter valid registration details', async function () {
  const timestamp = Date.now();
  this.firstName = 'TestFirstName';
  this.lastName = 'TestLastName';
  this.email = `testuser${timestamp}@example.com`;
  this.password   = 'Test@1234';

  await this.page.getByRole('radio', { name:'Male' }).check();  
  await this.page.getByRole('textbox', { name:'FirstName' }).fill(this.firstName);
  await this.page.getByRole('textbox', { name:'LastName' }).fill(this.lastName);
  await this.page.getByRole('textbox', { name:'Email' }).fill(this.email);
  await this.page.getByRole('textbox', { name:'Password' }).fill(this.password);
  await this.page.getByRole('textbox', { name:'ConfirmPassword' }).fill(this.password);
}   );

When('I click the register button', async function () {
  await this.page.getByRole('button', { name: 'Register' }).click();
});

Then('I should see a successful registration message', async function () {
  const successMessage = this.page.locator('.result');
  await expect(successMessage).toBeVisible();
  await expect(successMessage).toHaveText('Your registration completed');
});

Then('I should be logged in automatically after registration', async function () {
  const accountLink = this.page.getByRole('link', { name: this.email });
  await expect(accountLink).toBeVisible();
});

Then('I should see the logout option in the menu after registration', async function () {
  const logoutLink = this.page.getByRole('link', { name: 'Log out' });
  await expect(logoutLink).toBeVisible();
});

Then('I should not be able to register with an already used email', async function () {
  const errorMessage = this.page.locator('.message-error .validation-summary-errors');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toHaveText(/The specified email already exists/);
});

When('I enter registration details with an existing email', async function () {
  this.firstName = 'TestFirstName';
  this.lastName = 'TestLastName';
  this.email = 'animesh213123@email.com';
  this.password = 'Test@1234';

  await this.page.getByRole('textbox', { name:'FirstName' }).fill(this.firstName);
  await this.page.getByRole('textbox', { name:'LastName' }).fill(this.lastName);
  await this.page.getByRole('textbox', { name:'Email' }).fill(this.email);
  await this.page.getByRole('textbox', { name:'Password' }).fill(this.password);
  await this.page.getByRole('textbox', { name:'ConfirmPassword' }).fill(this.password);
});
