@pending @persona @screenplay
Feature: Operator observability expectations
  Oli wants to keep an infl0 instance healthy without reading through user
  timelines.

  Scenario: Oli sees an attention-first source health overview
    Given Oli is an operator
    And crawler source health has been reported
    When Oli opens operator source observability
    Then Oli should see the health summary
    And sources needing attention should be listed first

  Scenario: Oli filters source health to the operational problem at hand
    Given Oli is reviewing operator source observability
    When Oli filters to blocked sources
    Then Oli should see blocked sources
    And Oli should not see healthy sources in that filtered view

  Scenario: Oli denies access to non-operators
    Given a regular reader tries to open operator observability
    Then the reader should be denied access
