@persona @screenplay
Feature: Curious explorer expectations
  Eli wants to understand the app by exploring navigation and explanations
  before committing to regular reading.

  @pending
  Scenario: Eli explores onboarding deeply before finishing it
    Given Eli is a new reader
    When Eli moves through every onboarding card
    And Eli opens full text where explanations are available
    Then Eli should understand sources, scoring, themes, and help

  Scenario: Eli opens the appearance settings from a deep link
    Given Eli is exploring settings
    When Eli opens settings section "/settings#display-appearance"
    Then Eli should see the "appearance" settings section

  Scenario: Eli opens the sorting settings from a deep link
    Given Eli is exploring settings
    When Eli opens settings section "/settings#sorting"
    Then Eli should see the "sorting" settings section

  Scenario: Eli follows section navigation to the colour palette
    Given Eli is exploring settings
    When Eli opens settings section "/settings"
    And Eli follows the settings section "display-palette"
    Then Eli should see the "theme" settings section

  @pending
  Scenario: Eli checks install affordances before signing in on a phone
    Given Eli starts as a signed-out visitor
    When Eli opens the sign-in page on a phone-sized viewport
    Then the browser should know how to install infl0
    And Eli should see a layout that works for phone install
