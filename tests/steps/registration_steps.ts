import { Given, When, Then } from '@cucumber/cucumber';
import { RegistrationPage } from '../pages/RegistrationPage';

Given('I click on registration page', async function () {  
  this.log('Clicking on registration link');
  const registrationPage = new RegistrationPage(this.page);
  await registrationPage.clickRegistrationLink();
  await registrationPage.verifyRegistrationPageTitle();
  this.log('On registration page');
});

When('I enter valid registration details', async function () {
  const timestamp = Date.now();
  this.firstName = 'TestFirstName';
  this.lastName = 'TestLastName';
  this.email = `testuser${timestamp}@example.com`;
  this.password   = 'Test@1234';

  const registrationPage = new RegistrationPage(this.page);
  await registrationPage.fillRegistrationForm(this.firstName, this.lastName, this.email, this.password);
}   );

When('I click the register button', async function () {
  const registrationPage = new RegistrationPage(this.page);
  await registrationPage.clickRegisterButton();
});

Then('I should see a successful registration message', async function () {
  const registrationPage = new RegistrationPage(this.page);
  await registrationPage.verifySuccessMessage();
});

Then('I should be logged in automatically after registration', async function () {
  const registrationPage = new RegistrationPage(this.page);
  await registrationPage.verifyLoggedInWithEmail(this.email);
});

Then('I should see the logout option in the menu after registration', async function () {
  const registrationPage = new RegistrationPage(this.page);
  await registrationPage.verifyLogoutOptionVisible();
});

Then('I should not be able to register with an already used email', async function () {
  const registrationPage = new RegistrationPage(this.page);
  await registrationPage.verifyDuplicateEmailError();
});

When('I enter registration details with an existing email', async function () {
  this.firstName = 'TestFirstName';
  this.lastName = 'TestLastName';
  this.email = 'animesh213123@email.com';
  this.password = 'Test@1234';

  const registrationPage = new RegistrationPage(this.page);
  await registrationPage.fillRegistrationForm(this.firstName, this.lastName, this.email, this.password);
});
