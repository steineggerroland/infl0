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

  Scenario: Robin resumes a previous article intentionally
    Given Robin has reader articles
    When Robin opens the timeline
    And Robin starts reading
    And Robin focuses the second reader article
    Then Robin's URL should point to the second reader article
    When Robin reloads the timeline
    Then Robin should see the reader start screen
    When Robin jumps to the last reader article
    Then Robin should return to the second reader article

  Scenario: Robin follows Help and returns without losing context
    Given Robin has reader articles
    When Robin opens the timeline
    And Robin starts reading
    And Robin focuses the second reader article
    Then Robin's URL should point to the second reader article
    When Robin opens Help from the floating menu
    And Robin returns to the timeline by opening home
    Then Robin should not see the reader start screen
    And Robin should return to the second reader article

  Scenario: Robin starts a fresh reader session at the current first article
    Given Robin has reader articles
    When Robin opens the timeline
    Then Robin should see the reader start screen
    And Robin should not see reader article cards
    When Robin starts reading
    Then Robin should return to the first reader article

  Scenario: Robin passively opens infl0 without marking an article read
    Given Robin has reader articles
    And Robin has reading behaviour tracking enabled
    When Robin opens the timeline
    Then Robin should see the reader start screen
    When Robin leaves infl0 without starting the reader
    Then Robin's first reader article should still be unread

  Scenario: Robin sees new articles since the last reader session
    Given Robin has reader articles
    And Robin's last reader session started before these articles arrived
    When Robin opens the timeline
    Then Robin should see 2 new reader articles on the reader start screen

  Scenario: Robin sees no resume action without a return context
    Given Robin has reader articles
    When Robin opens the timeline
    Then Robin should see the reader start screen
    And Robin should not see the resume reader action

  Scenario: Robin does not resume a hidden read article
    Given Robin has reader articles
    When Robin opens the timeline
    And Robin starts reading
    And Robin focuses the second reader article
    And Robin marks the current reader article as read
    And Robin hides read articles in their timeline
    When Robin reloads the timeline
    Then Robin should see the reader start screen
    And Robin should not see the resume reader action

  Scenario: Robin's reader URL stays calm until reading starts
    Given Robin has reader articles
    When Robin opens the timeline
    And Robin starts reading
    And Robin focuses the second reader article
    Then Robin's URL should point to the second reader article
    When Robin reloads the timeline
    Then Robin should see the reader start screen

  Scenario: Robin sees visible feedback for a read article
    Given Robin has reader articles
    And Robin's first reader article is already read
    And Robin opens the timeline
    When Robin starts reading
    And Robin focuses the first reader article
    Then Robin's current reader article should show that it is read

  Scenario: Robin can read without behaviour tracking
    Given Robin has reader articles
    And Robin has reading behaviour tracking disabled
    And Robin opens the timeline
    When Robin starts reading
    And Robin focuses the first reader article
    Then Robin's current reader article should become read
    And Robin's current reader article should have no reading behaviour event

  Scenario: Robin marks the focused article unread with the shortcut
    Given Robin has reader articles
    And Robin's first reader article is already read
    And Robin opens the timeline
    When Robin starts reading
    And Robin focuses the first reader article
    And Robin presses the read-state shortcut
    Then Robin's current reader article should become unread

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
