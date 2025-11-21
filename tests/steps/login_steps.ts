import { Given, When, Then } from '@cucumber/cucumber';
    
    Given('I am on the login page', async function () {
        console.log('Navigating to login page');
    });
    When('I enter valid credentials', async function () {
        console.log('Entering valid credentials'); 
         });
    When('I click the login button', async function () {
           console.log('Clicking login button');
         });
    Then('I should be redirected to the dashboard', async function () {
           console.log('Verifying redirection to dashboard');
         });
    Then('I should see a welcome message', async function () {
           console.log('Verifying welcome message');
         });