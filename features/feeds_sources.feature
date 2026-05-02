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
    Then I should see the source list containing "https://example.com/bdd-feed.xml"
    When I remove the source row for "https://example.com/bdd-feed.xml"
    Then I should see the empty sources hint
