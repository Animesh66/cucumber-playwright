Feature: Login Functionality
    As a registered user
    I want to log in to the application
    So that I can access my account and personalized features
    
    Scenario: Successful login with valid credentials
        Given I am on the home page
        And I click the login link
        When I enter email as "animesh213123@email.com" and password "Weclome@123" 
        And I click the login button
        Then I should see my username displayed on the page