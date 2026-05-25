@pending @persona @screenplay
Feature: Curious explorer expectations
  Eli wants to understand the app by exploring navigation and explanations
  before committing to regular reading.

  Scenario: Eli explores onboarding deeply before finishing it
    Given Eli is a new reader
    When Eli moves through every onboarding card
    And Eli opens full text where explanations are available
    Then Eli should understand sources, scoring, themes, and help

  Scenario: Eli uses navigation to understand the settings structure
    Given Eli is exploring infl0
    When Eli opens settings from multiple entry points
    And Eli follows section navigation
    Then Eli should land on the expected settings section
    And the current section should be visible

  Scenario: Eli checks install affordances before signing in on a phone
    Given Eli starts as a signed-out visitor
    When Eli opens the sign-in page on a phone-sized viewport
    Then the browser should know how to install infl0
    And Eli should see a layout that works for phone install
