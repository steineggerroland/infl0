Feature: Managing timeline sources
  As a reader curating my inflow
  I want to add and remove feed sources from the UI
  So that my timeline only reflects sources I chose

  Background:
    Given I am signed in with a fresh onboarding account

  Scenario: Add a source then remove it
    When I open the sources page
    Then I should see the empty sources hint
    When I add a source with address "https://example.com/bdd-feed.xml" and display name "BDD feed"
    Then I should see the sources list heading
    And I should see the source list containing "https://example.com/bdd-feed.xml"
    When I remove the source row for "https://example.com/bdd-feed.xml"
    Then I should see the empty sources hint

  Scenario: A new source has no health snapshot until the crawler reports
    When I open the sources page
    Then I should see the empty sources hint
    When I add a source with address "https://example.com/bdd-no-snapshot.xml" and display name "BDD No Snapshot"
    Then the feed row for "https://example.com/bdd-no-snapshot.xml" should have source health "no_snapshot"
    When I expand the source row for "https://example.com/bdd-no-snapshot.xml"
    Then the expanded health label for "https://example.com/bdd-no-snapshot.xml" should include "No status yet"
    When I remove the source row for "https://example.com/bdd-no-snapshot.xml"
    Then I should see the empty sources hint

  Scenario: Pause and resume a source
    When I open the sources page
    Then I should see the empty sources hint
    When I add a source with address "https://example.com/bdd-pause.xml" and display name "BDD Pause"
    Then the source row for "https://example.com/bdd-pause.xml" should be active
    When I pause the source row for "https://example.com/bdd-pause.xml"
    Then the source row for "https://example.com/bdd-pause.xml" should be paused
    When I resume the source row for "https://example.com/bdd-pause.xml"
    Then the source row for "https://example.com/bdd-pause.xml" should be active
    When I remove the source row for "https://example.com/bdd-pause.xml"
    Then I should see the empty sources hint

  @crawler
  Scenario: Feed row exposes canonical crawler health (TopicKnowledgeCrawler contract)
    Given the crawler API key is configured
    When I open the sources page
    And I add a source with address "https://example.com/bdd-health-contract.xml" and display name "Health BDD"
    And I post crawler source health for the last added source as "needs_setup"
    Then the feed row for "https://example.com/bdd-health-contract.xml" should have source health "needs_setup"
    When I remove the source row for "https://example.com/bdd-health-contract.xml"
    Then I should see the empty sources hint

  @crawler
  Scenario: Expanded row shows user-facing health label from crawler status
    Given the crawler API key is configured
    When I open the sources page
    Then I should see the empty sources hint
    When I add a source with address "https://example.com/bdd-healthy-label.xml" and display name "Health label BDD"
    And I post crawler source health for the last added source as "healthy"
    Then the feed row for "https://example.com/bdd-healthy-label.xml" should have source health "healthy"
    When I expand the source row for "https://example.com/bdd-healthy-label.xml"
    Then the expanded health label for "https://example.com/bdd-healthy-label.xml" should include "All good"
    When I remove the source row for "https://example.com/bdd-healthy-label.xml"
    Then I should see the empty sources hint
