@pending @persona @screenplay
Feature: Sensory customizer expectations
  Mira wants to tune infl0 before reading so the experience feels comfortable.

  Scenario: Mira configures the visual theme before starting to read
    Given Mira is a new reader
    When Mira opens display settings
    And Mira changes the palette for cards
    Then Mira should see the new colors on the reading surfaces
    And those colors should persist after returning to the timeline

  Scenario: Mira changes typography from onboarding before real articles
    Given Mira is in onboarding
    When Mira uses readability shortcuts on front, back, and full text
    Then each active surface should respond predictably
    And the onboarding card should remain selected

  Scenario: Mira chooses a low-stimulation reading setup
    Given Mira is preparing to read
    When Mira chooses calmer display preferences
    Then infl0 should reduce visual friction without hiding the reader controls
