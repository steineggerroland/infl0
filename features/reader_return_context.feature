Feature: Reader context stays stable
  As a user reading articles in infl0
  I want the reader to remember my current article and show read feedback
  So that I do not feel lost when the inflow changes or marks an article read

  Background:
    Given I am signed in with a fresh onboarding account
    And my inflow contains reader articles

  Scenario: Returning to the reader restores my previous article
    Given I open the timeline
    When I start reading
    And I focus the second reader article
    Then the URL should point to the second reader article
    When I reload the timeline
    Then I should see the reader start screen
    When I jump to the last reader article
    Then the second reader article should be restored as my current reader article

  Scenario: Starting a fresh reader session begins at the current first article
    Given I open the timeline
    Then I should see the reader start screen
    And I should not see reader article cards
    When I start reading
    Then the first reader article should be restored as my current reader article

  Scenario: Opening the app passively does not mark the current article read
    Given reading behaviour tracking is enabled
    When I open the timeline
    Then I should see the reader start screen
    When I leave the app without starting the reader
    Then the first reader article should still be unread

  Scenario: The reader start shows new articles since the last reader session
    Given my last reader session started before these articles arrived
    When I open the timeline
    Then I should see 2 new reader articles on the reader start screen

  Scenario: The resume action is hidden without a return context
    When I open the timeline
    Then I should see the reader start screen
    And I should not see the resume reader action

  Scenario: Reader URLs stay calm until the user starts reading
    Given I open the timeline
    When I start reading
    And I focus the second reader article
    Then the URL should point to the second reader article
    When I reload the timeline
    Then I should see the reader start screen

  Scenario: A read article gives visible read feedback
    Given the first reader article is already read
    And I show read reader articles
    And I open the timeline
    When I start reading
    And I focus the first reader article
    Then the current reader article should show that it is read

  Scenario: Reading an article marks it read without behaviour tracking
    Given reading behaviour tracking is disabled
    And I open the timeline
    When I start reading
    And I focus the first reader article
    Then the current reader article should become read
    And no reading behaviour event should be stored for the current reader article

  Scenario: The read shortcut marks the focused article unread
    Given the first reader article is already read
    And I show read reader articles
    And I open the timeline
    When I start reading
    And I focus the first reader article
    And I press the read-state shortcut
    Then the current reader article should become unread
