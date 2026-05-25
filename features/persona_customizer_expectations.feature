@persona @screenplay
Feature: Sensory customizer expectations
  Mira wants to tune infl0 before reading so the experience feels comfortable.

  Scenario: Mira saves a calmer display setup
    Given Mira is preparing display settings
    When Mira chooses calmer display preferences
    Then Mira's display preferences should stay saved

  Scenario: Mira keeps custom colours for the card front
    Given Mira is preparing display settings
    When Mira chooses custom card-front colours
    Then Mira's custom card-front colours should stay available

  @pending
  Scenario: Mira changes typography from onboarding before real articles
    Given Mira is in onboarding
    When Mira uses readability shortcuts on front, back, and full text
    Then each active surface should respond predictably
    And the onboarding card should remain selected

  @pending
  Scenario: Mira chooses a low-stimulation reading setup
    Given Mira is preparing to read
    When Mira chooses calmer display preferences
    Then infl0 should reduce visual friction without hiding the reader controls
