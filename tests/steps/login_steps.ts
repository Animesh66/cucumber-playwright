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
  console.log(`Entering email: ${email}`);
  this.log(`Entering credentials - Email: ${email}`);
  this.email = email;
  this.password = password;
  const loginPage = new LoginPage(this.page);
  await loginPage.enterEmail(email);
  await loginPage.enterPassword(password);
  console.log('Email and password entered successfully');
});

When('I click the login button', async function () {
  console.log('Clicking login button');
  this.log('Submitting login form');
  const loginPage = new LoginPage(this.page);
  await loginPage.clickLoginButton();
  console.log('Login button clicked');
});

Then('I should see my username displayed on the page', async function () {
  console.log(`Verifying username displayed: ${this.email}`);
  this.log('Checking if user is logged in');
  const loginPage = new LoginPage(this.page);
  await loginPage.verifyUsernameDisplayed(this.email);
  console.log('Username verification successful');
});

Then('I should see the logout option in the menu', async function () {
  console.log('Verifying logout option is visible');
  this.log('Checking logout link visibility');
  const loginPage = new LoginPage(this.page);
  await loginPage.verifyLogoutOptionVisible();
  console.log('Logout option verified successfully');
});

Then('I should see an error message indicating invalid credentials', async function () {
  console.log('Verifying invalid credentials error message');
  this.log('Checking for error message display');
  const loginPage = new LoginPage(this.page);
  await loginPage.verifyInvalidCredentialsError();
  console.log('Invalid credentials error verified');
});