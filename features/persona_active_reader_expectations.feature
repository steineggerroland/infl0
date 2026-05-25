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

  Scenario: Robin sees the sign-in name and recovery email in settings
    Given Robin is a new reader
    When Robin registers for infl0
    And Robin opens account settings
    Then Robin should see their sign-in name in account settings
    And Robin should see their recovery email in account settings

  Scenario: Robin sees a rich article teaser and back
    Given Robin is signed in to infl0
    And Robin has a rich article in the timeline
    And Robin opens the timeline
    And Robin starts reading
    When Robin views the teaser of the rich article
    Then Robin should see the rich article teaser
    When Robin flips the focused card to the back
    Then Robin should see the rich article back
    When Robin opens the original article from the focused card back
    Then Robin should see the rich article body in the reader dialog

  Scenario: Robin sees a minimal article without optional back fields
    Given Robin is signed in to infl0
    And Robin has a minimal article in the timeline
    And Robin opens the timeline
    And Robin starts reading
    When Robin views the teaser of the minimal article
    Then Robin should see the minimal article teaser
    When Robin flips the focused card to the back
    Then Robin should see the minimal article back without optional fields

  Scenario: Robin sees a minimal episode with core fields only
    Given Robin is signed in to infl0
    And Robin has a minimal episode in the timeline
    And Robin opens the timeline
    And Robin starts reading
    When Robin views the teaser of the minimal episode
    Then Robin should see the minimal episode teaser
    When Robin flips the focused card to the back
    Then Robin should see the minimal episode back with core actions only

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
