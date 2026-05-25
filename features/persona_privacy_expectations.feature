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

  Scenario: Priya understands that scoring is transparent and adjustable
    Given Priya is reviewing scoring transparency in onboarding
    Then Priya should see algorithm control explained

  Scenario: Priya sees that reading behaviour tracking is optional
    Given Priya is reviewing scoring transparency in onboarding
    When Priya flips the scoring explanation
    Then Priya should see tracking described as optional but useful

  Scenario: Priya reaches sorting controls from the scoring explanation
    Given Priya is reviewing scoring transparency in onboarding
    When Priya opens scoring controls from onboarding
    Then Priya should land on sorting controls

  Scenario: Priya finds all scoring-related controls from full text
    Given Priya is reviewing scoring transparency in onboarding
    When Priya opens the scoring full text
    Then Priya should see scoring links to the relevant controls

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
