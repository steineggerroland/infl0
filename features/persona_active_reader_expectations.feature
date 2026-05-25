@persona @screenplay
Feature: Active returning reader expectations
  Robin wants to drop back into reading and work with articles or podcasts
  without losing their place.

  Scenario: Robin signs in and reaches the timeline
    Given Robin has an infl0 account
    When Robin signs in to infl0
    Then Robin should reach their timeline

  Scenario: Robin signs out before leaving infl0
    Given Robin is signed in to infl0
    When Robin signs out
    Then Robin should be asked to sign in before reading

  @pending
  Scenario: Robin resumes a previous article intentionally
    Given Robin has a remembered reader article
    When Robin opens infl0
    And Robin chooses to jump to the last article
    Then Robin should continue at the remembered article
    And Robin should see whether it is already read

  @pending
  Scenario: Robin follows an original article and returns without losing context
    Given Robin is reading an article card
    When Robin opens the original article
    And Robin returns to infl0
    Then Robin should still be oriented on the same card

  @pending
  Scenario: Robin works through an episode with keyboard and tabs
    Given Robin is reading an episode card
    When Robin opens episode details with the keyboard
    And Robin switches between content and transcript
    Then Robin should stay in an accessible dialog
    And focus should return to the episode action after closing

  @pending
  Scenario: Robin adjusts reading controls mid-session
    Given Robin is reading a focused card
    When Robin changes font size and typeface with shortcuts
    Then the focused reading surface should reflect those changes
    And the reader context should remain stable
