@persona @screenplay
Feature: Oli operator observability
  Oli wants to keep an infl0 instance healthy without reading through user
  timelines.

  Scenario: Oli sees an attention-first source health overview
    Given Oli is an operator
    And crawler source health has been reported for Oli
    When Oli opens operator source observability
    Then Oli should see the health summary
    And sources needing attention should be listed first for Oli
    And Oli should see operator source rows

  Scenario: Oli filters source health to the operational problem at hand
    Given Oli is reviewing operator source observability
    When Oli opens operator source observability
    And Oli filters operator sources to "Blocked"
    Then Oli should see blocked sources
    And Oli should not see healthy sources in that filtered view
    When Oli filters operator sources to "Quiet"
    Then Oli should see quiet sources
    And Oli should not see blocked sources in that filtered view

  Scenario: Oli denies access to non-operators
    Given a regular reader tries to open operator observability
    Then the reader should be denied access
