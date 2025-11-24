Feature: Registration Functionality
  As a new user
  I want to register an account on the website
  So that I can access member-only features

  Scenario: Successful registration with valid details
    Given I am on the registration page
    When I enter valid registration details
    And I submit the registration form
    Then I should see a confirmation message indicating successful registration

  Scenario: Unsuccessful registration with existing email
    Given I am on the registration page
    When I enter registration details with an existing email
    And I submit the registration form
    Then I should see an error message indicating the email is already in use