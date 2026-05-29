
@planned @persona @screenplay
Feature: knowledge-inbox

  Robin wants to save interesting articles into a knowledge inbox
  so that they can find and process them later in a focused environment.

  Background:
    Given Robin is logged in
    And Robin is on the timeline

  Scenario: Saving an article to the knowledge inbox
    When Robin saves an article "The Future of AI" to the knowledge inbox
    Then Robin should see a calm confirmation that it was saved
    And Robin should see the article marked as "saved" in the timeline

  Scenario: Browsing captured items in chronological order
    Given Robin has saved articles in the following order:
      | title             | date       |
      | First Discovery   | 2026-05-01 |
      | Second Insight    | 2026-05-02 |
      | Latest News       | 2026-05-03 |
    When Robin navigates to the knowledge inbox
    Then Robin should see "Latest News" as the first item in the list
    And Robin should see "First Discovery" as the last item in the list
    And Robin should see a teaser snippet for each entry

  Scenario: Returning to reader view from the inbox
    Given Robin has an article "Deep Dive into Vue 3" in the knowledge inbox
    When Robin navigates to the knowledge inbox
    And Robin clicks on the entry for "Deep Dive into Vue 3"
    Then Robin should be taken to the full reader view of that article

  Scenario: Removing an item from the knowledge inbox
    Given Robin has an article "Old News" in the knowledge inbox
    When Robin navigates to the knowledge inbox
    And Robin removes "Old News" from the inbox
    Then Robin should no longer see "Old News" in the knowledge inbox list
    But the original article should still be available in the system
