
@planned @persona @screenplay
Feature: knowledge-inbox

  Savy wants to save interesting articles into a knowledge inbox
  so that they can find and process them later in a focused environment.

  Background:
    Given Savy is logged in
    And Savy is on the timeline

  Scenario: Saving an article to the knowledge inbox
    When Savy saves an article "The Future of AI" to the knowledge inbox
    Then Savy should see a calm confirmation that it was saved
    And Savy should see the article marked as "saved" in the timeline

  Scenario: Browsing captured items in chronological order
    Given Savy has saved articles in the following order:
      | title             | date       |
      | First Discovery   | 2026-05-01 |
      | Second Insight    | 2026-05-02 |
      | Latest News       | 2026-05-03 |
    When Savy navigates to the knowledge inbox
    Then Savy should see "Latest News" as the first item in the list
    And Savy should see "First Discovery" as the last item in the list
    And Savy should see a teaser snippet for each entry

  Scenario: Returning to reader view from the inbox
    Given Savy has an article "Deep Dive into Vue 3" in the knowledge inbox
    When Savy navigates to the knowledge inbox
    And Savy clicks on the entry for "Deep Dive into Vue 3"
    Then Savy should be taken to the full reader view of that article

  Scenario: Removing an item from the knowledge inbox
    Given Savy has an article "Old News" in the knowledge inbox
    When Savy navigates to the knowledge inbox
    And Savy removes "Old News" from the inbox
    Then Savy should no longer see "Old News" in the knowledge inbox list
    But the original article should still be available in the system
    And Savy should see the article "Old News" marked as "not saved" in the timeline

  Scenario: Removing an article from the knowledge inbox on its card
    Given Savy has an article "Card Cleanup" in the knowledge inbox
    When Savy removes the article "Card Cleanup" from the knowledge inbox on its card
    Then Savy should see the article "Card Cleanup" marked as "not saved" in the timeline
    When Savy navigates to the knowledge inbox
    Then Savy should no longer see "Card Cleanup" in the knowledge inbox list

  Scenario: Saving a podcast episode to the knowledge inbox
    When Savy saves an episode "Deep Dive into Rust" to the knowledge inbox
    Then Savy should see a calm confirmation that it was saved
    And Savy should see the episode marked as "saved" in the timeline

  Scenario: Episode is listed in the knowledge inbox
    Given Savy has saved an episode "The Science of Sleep" in the knowledge inbox
    When Savy navigates to the knowledge inbox
    Then Savy should see an entry for "The Science of Sleep" in the knowledge inbox list
    And Savy should see a teaser snippet for each entry

  Scenario: Removing an episode from the knowledge inbox
    Given Savy has saved an episode "The History of Sound" in the knowledge inbox
    When Savy navigates to the knowledge inbox
    And Savy removes "The History of Sound" from the inbox
    Then Savy should no longer see "The History of Sound" in the knowledge inbox list

  Scenario: Removing an episode from the knowledge inbox on its card
    Given Savy has saved an episode "Card Episode Cleanup" in the knowledge inbox
    When Savy removes the episode "Card Episode Cleanup" from the knowledge inbox on its card
    Then Savy should see the episode "Card Episode Cleanup" marked as "not saved" in the timeline
    When Savy navigates to the knowledge inbox
    Then Savy should no longer see "Card Episode Cleanup" in the knowledge inbox list

  Scenario: Mixed article and episode items in the knowledge inbox
    Given Savy has saved the following items in the knowledge inbox:
      | title         | type    | date       |
      | Tech Article  | article | 2026-05-01 |
      | Cool Episode  | episode | 2026-05-02 |
    When Savy navigates to the knowledge inbox
    Then Savy should see "Cool Episode" as the first item in the list
    And Savy should see an entry for "Tech Article" in the knowledge inbox list
    And Savy should see an entry for "Cool Episode" in the knowledge inbox list
    And Savy should see a teaser snippet for each entry
