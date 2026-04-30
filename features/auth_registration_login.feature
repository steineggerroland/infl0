Feature: Registration and login from a user perspective
  As a new or returning user
  I want to register and sign in through the UI
  So that I can access my timeline without technical setup steps

  Scenario: New user registers and reaches onboarding timeline
    Given I start as a signed-out visitor
    When I open the registration page
    And I register with a fresh valid account
    Then I should land on "/"
    And I should see the timeline screen

  Scenario: Existing user signs in and reaches timeline
    Given I start as a signed-out visitor
    And I have a freshly registered account credentials
    When I open the login page
    And I sign in with my registered account
    Then I should land on "/"
    And I should see the timeline screen

  Scenario: Existing user signs out and is logged out
    Given I am signed in with a fresh onboarding account
    And I open the timeline
    When I log out
    Then I should land on "/login"
    When I open the timeline
    Then I should land on "/login"
