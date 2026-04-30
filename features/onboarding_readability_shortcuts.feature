Feature: Onboarding supports the same readability shortcuts as articles
  As a user reading onboarding cards
  I want the same readability shortcuts as article cards
  So that typography controls feel consistent everywhere

  Background:
    Given I am signed in with a fresh onboarding account
    And I open the timeline

  Scenario Outline: Font size shortcuts affect the active surface
    When I focus the "<topic>" onboarding card
    And I am on the "<surface>" side of that card
    When I press "<shortcut>"
    Then the font size for "<surface>" should change accordingly

    Examples:
      | topic   | surface    | shortcut |
      | intro   | front      | +        |
      | intro   | front      | -        |
      | intro   | front      | 0        |
      | scoring | back       | +        |
      | scoring | back       | -        |
      | intro   | full-text  | +        |

  Scenario: Typeface shortcuts cycle fonts on active surface
    When I focus the "themes" onboarding card
    And I flip the "themes" onboarding card
    When I press "Shift+L"
    Then the typeface for card back should move forward
    When I press "Shift+K"
    Then the typeface for card back should move backward
