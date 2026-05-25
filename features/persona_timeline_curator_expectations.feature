@pending @persona @screenplay
Feature: Timeline curator expectations
  Sam wants to actively shape the inflow by managing sources, podcasts, and
  future filtering tools.

  Scenario: Sam adds, pauses, resumes, and removes a source
    Given Sam manages their timeline sources
    When Sam adds a new source
    And Sam pauses that source
    And Sam resumes that source
    And Sam removes that source
    Then Sam should see the source list reflect each decision

  Scenario: Sam understands source health before deciding what to do
    Given Sam has sources with crawler health snapshots
    When Sam expands a source row
    Then Sam should see a user-facing health explanation
    And Sam should see the next useful action

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
