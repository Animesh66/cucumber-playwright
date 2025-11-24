Feature: Registration Functionality
  As a new user
  I want to register an account on the website
  So that I can access member-only features

  Scenario: Successful registration with valid details
    Given I click on registration page
    When I enter valid registration details
    And I click the register button
    Then I should see a successful registration message
    And I should be logged in automatically after registration
    And I should see the logout option in the menu after registration

  Scenario: Unsuccessful registration with existing email
    Given I click on registration page
    When I enter registration details with an existing email
    And I click the register button
    Then I enter registration details with an existing email