import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class RegistrationPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async clickRegistrationLink() {
    await this.page.getByRole('link', { name: 'Register' }).click();
  }

  async verifyRegistrationPageTitle() {
    await expect(this.page).toHaveTitle(/Register/);
  }

  async selectGender(gender: string) {
    await this.page.getByRole('radio', { name: gender, exact: true }).check();
  }

  async enterFirstName(firstName: string) {
    await this.page.getByRole('textbox', { name: 'First Name' }).fill(firstName);
  }

  async enterLastName(lastName: string) {
    await this.page.getByRole('textbox', { name: 'Last Name' }).fill(lastName);
  }

  async enterEmail(email: string) {
    await this.page.getByRole('textbox', { name: 'Email' }).fill(email);
  }

  async enterPassword(password: string) {
    await this.page.getByRole('textbox', { name: 'Password:', exact: true }).fill(password);
  }

  async enterConfirmPassword(password: string) {
    await this.page.getByRole('textbox', { name: 'Confirm Password:' }).fill(password);
  }

  async clickRegisterButton() {
    await this.page.getByRole('button', { name: 'Register' }).click();
  }

  async verifySuccessMessage() {
    const successMessage = this.page.locator('.result');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toHaveText('Your registration completed');
  }

  async verifyLoggedInWithEmail(email: string) {
    const accountLink = this.page.getByRole('link', { name: email });
    await expect(accountLink).toBeVisible();
  }

  async verifyLogoutOptionVisible() {
    const logoutLink = this.page.getByRole('link', { name: 'Log out' });
    await expect(logoutLink).toBeVisible();
  }

  async verifyDuplicateEmailError() {
    const errorMessage = this.page.locator('.message-error .validation-summary-errors');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText(/The specified email already exists/);
  }

  async fillRegistrationForm(firstName: string, lastName: string, email: string, password: string) {
    await this.selectGender('Male');
    await this.enterFirstName(firstName);
    await this.enterLastName(lastName);
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.enterConfirmPassword(password);
  }
}
