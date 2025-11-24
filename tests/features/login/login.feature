Feature: Login Functionality
    As a registered user
    I want to log in to the application
    So that I can access my account and personalized features
    
    Scenario: Successful login with valid credentials
        Given I click the login link
        When I enter email as "animesh213123@email.com" and password "Welcome@1" 
        And I click the login button
        Then I should see my username displayed on the page
        And I should see the logout option in the menu

    Scenario: Unsuccessful login with invalid credentials
        Given I click the login link
        When I enter email as "invalid@email.com" and password "WrongPassword" 
        And I click the login button
        Then I should see an error message indicating invalid credentials