import { Given, When, Then } from '@cucumber/cucumber';
import { RegistrationPage } from '../pages/RegistrationPage';

Given('I click on registration page', async function () {  
  console.log('Clicking on registration link');
  const registrationPage = new RegistrationPage(this.page);
  await registrationPage.clickRegistrationLink();
  await registrationPage.verifyRegistrationPageTitle();
  console.log('On registration page');
  console.log('Registration page verified successfully');
});

When('I enter valid registration details', async function () {
  const timestamp = Date.now();
  this.firstName = 'TestFirstName';
  this.lastName = 'TestLastName';
  this.email = `testuser${timestamp}@example.com`;
  this.password   = 'Test@1234';

  console.log(`Filling registration form with email: ${this.email}`);
  this.log(`Registering new user: ${this.firstName} ${this.lastName}`);
  const registrationPage = new RegistrationPage(this.page);
  await registrationPage.fillRegistrationForm(this.firstName, this.lastName, this.email, this.password);
  console.log('Registration form filled successfully');
}   );

When('I click the register button', async function () {
  console.log('Clicking register button');
  this.log('Submitting registration form');
  const registrationPage = new RegistrationPage(this.page);
  await registrationPage.clickRegisterButton();
  console.log('Register button clicked');
});

Then('I should see a successful registration message', async function () {
  console.log('Verifying registration success message');
  this.log('Checking for registration completion message');
  const registrationPage = new RegistrationPage(this.page);
  await registrationPage.verifySuccessMessage();
  console.log('Registration success message verified');
});

Then('I should be logged in automatically after registration', async function () {
  console.log(`Verifying auto-login with email: ${this.email}`);
  this.log('Checking automatic login after registration');
  const registrationPage = new RegistrationPage(this.page);
  await registrationPage.verifyLoggedInWithEmail(this.email);
  console.log('Auto-login verified successfully');
});

Then('I should see the logout option in the menu after registration', async function () {
  console.log('Verifying logout option after registration');
  this.log('Checking logout link visibility post-registration');
  const registrationPage = new RegistrationPage(this.page);
  await registrationPage.verifyLogoutOptionVisible();
  console.log('Logout option verified after registration');
});

Then('I should not be able to register with an already used email', async function () {
  console.log('Verifying duplicate email error message');
  this.log('Checking for duplicate email validation error');
  const registrationPage = new RegistrationPage(this.page);
  await registrationPage.verifyDuplicateEmailError();
  console.log('Duplicate email error verified');
});

When('I enter registration details with an existing email', async function () {
  this.firstName = 'TestFirstName';
  this.lastName = 'TestLastName';
  this.email = 'animesh213123@email.com';
  this.password = 'Test@1234';

  console.log(`Attempting registration with existing email: ${this.email}`);
  this.log('Filling form with duplicate email for testing');
  const registrationPage = new RegistrationPage(this.page);
  await registrationPage.fillRegistrationForm(this.firstName, this.lastName, this.email, this.password);
  console.log('Registration form filled with existing email');
});
