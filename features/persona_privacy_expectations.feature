@persona @screenplay
Feature: Privacy-sensitive reader expectations
  Priya wants to understand and control what infl0 learns from her reading.

  Scenario: Priya finds reading behaviour tracking directly
    Given Priya is a privacy-sensitive reader
    When Priya reviews reading behaviour tracking
    Then Priya should see the reading behaviour tracking control

  Scenario: Priya changes reading behaviour tracking deliberately
    Given Priya is a privacy-sensitive reader
    When Priya reviews reading behaviour tracking
    And Priya notes whether reading behaviour tracking is enabled
    And Priya changes reading behaviour tracking
    Then Priya's reading behaviour tracking choice should change

  Scenario: Priya inspects the personalization explainer
    Given Priya is a privacy-sensitive reader
    When Priya opens personalization
    Then Priya should see the personalization explainer

  @pending
  Scenario: Priya opens infl0 passively without creating reading behaviour data
    Given Priya has unread articles in her inflow
    When Priya opens infl0 without starting the reader
    And Priya leaves for settings
    Then Priya should still have no reading behaviour event for that article

  @pending
  Scenario: Priya can inspect why personalization changed after opting in
    Given Priya has enabled reading behaviour tracking
    And Priya has read articles from multiple sources
    When Priya opens personalization
    Then Priya should see which signals influenced ranking
    And Priya should be able to reach the controls for changing those signals
