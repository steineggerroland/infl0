@pending @persona @screenplay
Feature: Privacy-sensitive reader expectations
  Priya wants to understand and control what infl0 learns from her reading.

  Scenario: Priya understands tracking before enabling it
    Given Priya is a privacy-sensitive reader
    When Priya reviews reading behaviour tracking
    Then Priya should see what data is used
    And Priya should see what stays optional
    And Priya should know where personalization can be inspected

  Scenario: Priya opens infl0 passively without creating reading behaviour data
    Given Priya has unread articles in her inflow
    When Priya opens infl0 without starting the reader
    And Priya leaves for settings
    Then Priya should still have no reading behaviour event for that article

  Scenario: Priya can inspect why personalization changed after opting in
    Given Priya has enabled reading behaviour tracking
    And Priya has read articles from multiple sources
    When Priya opens personalization
    Then Priya should see which signals influenced ranking
    And Priya should be able to reach the controls for changing those signals
