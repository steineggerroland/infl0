@persona @screenplay
Feature: Mira display customizer
  Mira wants to tune infl0 before reading so the experience feels comfortable.

  Scenario: Mira saves a calmer display setup
    Given Mira is preparing display settings
    When Mira chooses calmer display preferences
    Then Mira's display preferences should stay saved

  Scenario: Mira keeps custom colours for the card front
    Given Mira is preparing display settings
    When Mira chooses custom card-front colours
    Then Mira's custom card-front colours should stay available

  Scenario Outline: Mira changes onboarding font size before real articles
    Given Mira is tuning onboarding readability
    When Mira uses "<shortcut>" on the "<surface>" side of the "<topic>" onboarding card
    Then Mira should see onboarding font size respond

    Examples:
      | topic   | surface   | shortcut |
      | intro   | front     | +        |
      | intro   | front     | -        |
      | intro   | front     | 0        |
      | scoring | back      | +        |
      | scoring | back      | -        |
      | intro   | full-text | +        |

  Scenario: Mira cycles onboarding typefaces before real articles
    Given Mira is tuning onboarding readability
    When Mira uses "Shift+L" on the "back" side of the "themes" onboarding card
    Then Mira should see onboarding typeface respond
    When Mira uses "Shift+K" on the "back" side of the "themes" onboarding card
    Then Mira should see onboarding typeface respond

  Scenario: Mira chooses a low-stimulation reading setup
    Given Mira is preparing to read
    Then infl0 should reduce visual friction without hiding the reader controls
