import { Given, When, Then, setDefaultTimeout } from '@cucumber/cucumber';
import { LoginPage } from '../pages/LoginPage';
import { logger } from '../support/helpers/logger';

setDefaultTimeout(120000); // setting the default timeout to 120 seconds

Given('I click the login link', async function () {
  this.log('Clicking on login link');
  const loginPage = new LoginPage(this.page);
  await loginPage.clickLoginLink();
  loginPage.verifyLoginPageURL();
  await loginPage.verifyLoginPageTitle();
  this.log('On login page');
});

When('I enter email as {string} and password {string}', async function (email, password) {
  logger.debug(`Entering email: ${email}`);
  this.log(`Entering credentials - Email: ${email}`);
  this.email = email;
  this.password = password;
  const loginPage = new LoginPage(this.page);
  await loginPage.enterEmail(email);
  await loginPage.enterPassword(password);
  logger.debug('Email and password entered successfully');
});

When('I click the login button', async function () {
  logger.debug('Clicking login button');
  this.log('Submitting login form');
  const loginPage = new LoginPage(this.page);
  await loginPage.clickLoginButton();
  logger.debug('Login button clicked');
});

Then('I should see my username displayed on the page', async function () {
  logger.info(`Verifying username displayed: ${this.email}`);
  this.log('Checking if user is logged in');
  const loginPage = new LoginPage(this.page);
  await loginPage.verifyUsernameDisplayed(this.email);
  logger.info('Username verification successful');
});

Then('I should see the logout option in the menu', async function () {
  logger.info('Verifying logout option is visible');
  this.log('Checking logout link visibility');
  const loginPage = new LoginPage(this.page);
  await loginPage.verifyLogoutOptionVisible();
  logger.info('Logout option verified successfully');
});

Then('I should see an error message indicating invalid credentials', async function () {
  logger.info('Verifying invalid credentials error message');
  this.log('Checking for error message display');
  const loginPage = new LoginPage(this.page);
  await loginPage.verifyInvalidCredentialsError();
  logger.info('Invalid credentials error verified');
});