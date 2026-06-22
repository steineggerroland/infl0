@persona @screenplay
Feature: Sam timeline curator
  Sam wants to actively shape the inflow by managing sources, podcasts, and
  future filtering tools.

  Scenario: Sam adds and removes a source
    Given Sam is ready to curate timeline sources
    Then Sam should see an empty source list
    When Sam adds that source
    Then Sam should see that source in their source list
    When Sam removes that source
    Then Sam should see an empty source list

  Scenario: Sam understands a source before the crawler reports
    Given Sam is ready to curate a source without crawler status
    Then Sam should see an empty source list
    When Sam adds that source
    Then Sam should see source health "no_snapshot"
    And Sam should see source health explained as "No status yet"
    When Sam removes that source
    Then Sam should see an empty source list

  Scenario: Sam pauses and resumes a source
    Given Sam is ready to pause and resume a source
    Then Sam should see an empty source list
    When Sam adds that source
    Then Sam should see that source as active
    When Sam pauses that source
    Then Sam should see that source as paused
    When Sam resumes that source
    Then Sam should see that source as active
    When Sam removes that source
    Then Sam should see an empty source list

  Scenario: Sam sees canonical crawler health
    Given Sam is ready to inspect crawler health "needs_setup"
    And Sam has crawler status reporting available
    When Sam adds that source
    And Sam receives crawler health "needs_setup" for that source
    Then Sam should see source health "needs_setup"
    When Sam removes that source
    Then Sam should see an empty source list

  Scenario: Sam reads crawler health explanations
    Given Sam is ready to inspect crawler health "healthy"
    And Sam has crawler status reporting available
    When Sam adds that source
    And Sam receives crawler health "healthy" for that source
    Then Sam should see source health "healthy"
    And Sam should see source health explained as "All good"
    When Sam removes that source
    Then Sam should see an empty source list

  Scenario: Sam weights a source to shape future ranking
    Given Sam has multiple active sources
    When Sam increases one source's weight
    Then Sam should see that the source preference was saved
    And future timeline ranking should respect that preference

  Scenario: Sam curates a smaller working set
    Given Sam has many feeds and podcasts
    When Sam creates a filter or favorites list
    Then Sam should be able to focus the timeline on that working set
    And Sam should be able to return to the full inflow
