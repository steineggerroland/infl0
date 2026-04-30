Feature: Onboarding journey guides a new user through infl0
  As a newly registered user
  I want a guided onboarding journey in my timeline
  So that I quickly understand how infl0 works

  Background:
    Given I am signed in with a fresh onboarding account
    And I open the timeline

  Scenario: Onboarding cards appear first in a clear order
    Then I should see onboarding cards before regular articles
    And the onboarding topics should be ordered as:
      | topic   |
      | intro   |
      | sources |
      | scoring |
      | themes  |

  Scenario: Intro card guides me to flip and continue
    When I focus the "intro" onboarding card
    Then I should see the intro headline
    And I should see guidance to flip the card
    When I flip the "intro" onboarding card
    Then I should see details about moving to the next and previous cards
    And I should see how to open full text

  Scenario: Intro full text points me to help
    When I open full text on the "intro" onboarding card
    Then I should see a link to "/help"
    And the copy should ask me to continue to the next onboarding card
