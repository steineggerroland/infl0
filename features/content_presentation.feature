Feature: Article and episode card presentation
  As a new infl0 user
  I want articles and episodes to show the right fields on the timeline cards
  So that rich content is readable and sparse items stay uncluttered

  Background:
    Given I start as a signed-out visitor
    When I open the registration page
    And I register with a fresh valid account

  Scenario: Rich article shows front teaser and back summary
    Given I have an article with all information
    And I open the timeline
    And I start reading
    When I view the teaser of the rich article
    Then I should see the rich article teaser
    When I flip the focused card to the back
    Then I should see the rich article back
    When I open the original article from the focused card back
    Then I should see the rich article body in the reader dialog

  Scenario: Minimal article hides optional back fields
    Given I have an article with little information
    And I open the timeline
    And I start reading
    When I view the teaser of the minimal article
    Then I should see the minimal article teaser
    When I flip the focused card to the back
    Then I should see the minimal article back without optional fields

  Scenario: Rich episode shows metadata, actions, and collapsible sections
    Given I have an episode with all information
    And I open the timeline
    And I start reading
    When I view the teaser of the rich episode
    Then I should see the rich episode teaser
    When I flip the focused card to the back
    Then I should see the rich episode back
    When I expand the chapters on the focused episode card
    Then I should see the expanded rich episode chapters
    When I expand the shownotes on the focused episode card
    Then I should see the expanded rich episode shownotes
    When I open the details of the focused episode card
    And I open the content tab in the episode details
    Then I should see the rich episode content tab
    When I open the transcript tab in the episode details
    Then I should see the rich episode transcript tab

  Scenario: Minimal episode shows only core fields
    Given I have an episode with little information
    And I open the timeline
    And I start reading
    When I view the teaser of the minimal episode
    Then I should see the minimal episode teaser
    When I flip the focused card to the back
    Then I should see the minimal episode back with core actions only
