import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async clickLoginLink() {
    await this.page.getByRole('link', { name: 'Log in' }).click();
  }

  async verifyLoginPageURL() {
    expect(this.page.url()).toContain('login');
  }

  async verifyLoginPageTitle() {
    await expect(this.page).toHaveTitle(/Login/);
  }

  async enterEmail(email: string) {
    await this.page.getByRole('textbox', { name: 'Email' }).fill(email);
  }

  async enterPassword(password: string) {
    await this.page.getByRole('textbox', { name: 'Password' }).fill(password);
  }

  async clickLoginButton() {
    await this.page.getByRole('button', { name: 'Log in' }).click();
  }

  async verifyUsernameDisplayed(email: string) {
    await expect(this.page.locator('.header-links .account')).toHaveText(email);
  }

  async verifyLogoutOptionVisible() {
    await expect(this.page.getByRole('link', { name: 'Log out' })).toBeVisible();
  }

  async verifyInvalidCredentialsError() {
    const errorMessage = this.page.locator('.message-error .validation-summary-errors');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText(/The credentials provided are incorrect/);
  }
}
