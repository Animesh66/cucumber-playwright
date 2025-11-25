import { Given, When, Then, setDefaultTimeout } from '@cucumber/cucumber';
import { LoginPage } from '../pages/LoginPage';

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
  this.email = email;
  this.password = password;
  const loginPage = new LoginPage(this.page);
  await loginPage.enterEmail(email);
  await loginPage.enterPassword(password);
});

When('I click the login button', async function () {
  const loginPage = new LoginPage(this.page);
  await loginPage.clickLoginButton();
});

Then('I should see my username displayed on the page', async function () {
  const loginPage = new LoginPage(this.page);
  await loginPage.verifyUsernameDisplayed(this.email);
});

Then('I should see the logout option in the menu', async function () {
  const loginPage = new LoginPage(this.page);
  await loginPage.verifyLogoutOptionVisible();
});

Then('I should see an error message indicating invalid credentials', async function () {
  const loginPage = new LoginPage(this.page);
  await loginPage.verifyInvalidCredentialsError();
});