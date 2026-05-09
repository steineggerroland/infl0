Feature: Display preferences
  As someone tuning infl0 for comfortable reading
  I want display settings to stay saved after I change them
  So that the app keeps the reading environment I chose

  Background:
    Given I am signed in with a fresh onboarding account
    And I use a wide viewport for the settings layout

  Scenario: Display choices stay saved after reload
    Given I open the settings page
    When I choose "Always dark" as display appearance
    And I choose the colour palette "Warm · red"
    And I choose "Reduced" as motion preference
    And I set the card front typeface to "Lexend"
    And I set the card front text size to 40 px
    And I reload the settings page
    Then "Always dark" should still be the display appearance
    And the colour palette "Warm · red" should still be selected
    And "Reduced" should still be the motion preference
    And the card front typeface should still be "Lexend"
    And the card front text size should still be 40 px

  Scenario: Custom colours stay available for each reading area
    Given I open the settings page
    When I choose custom colours as colour palette
    Then I should see colour controls for the card front
    When I set the card front background colour to "#123456"
    And I reload the settings page
    Then I should see colour controls for the card front
    And the card front background colour should still be "#123456"
