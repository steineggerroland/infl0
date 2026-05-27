@persona @screenplay
Feature: Shorty keyboard shortcut expectations
  Shorty loves keyboard shortcuts, flips through card surfaces, and checks that
  infl0 documents shortcuts honestly on the help page.

  Scenario: Shorty reads the shortcuts reference on the help page
    Given Shorty is signed in to infl0
    When Shorty opens the keyboard shortcuts reference in Help
    Then Shorty should see the shortcuts reference on the help page
    And Shorty should see every documented shortcut group in Help

  Scenario: Shorty explores rich episode metadata and collapsible sections
    Given Shorty is signed in to infl0
    And Shorty has a rich episode in the timeline
    And Shorty opens the timeline
    And Shorty starts reading
    When Shorty views the teaser of the rich episode
    Then Shorty should see the rich episode teaser
    When Shorty flips the focused card to the back
    Then Shorty should see the rich episode back
    When Shorty expands the chapters on the focused episode card
    Then Shorty should see the expanded rich episode chapters
    When Shorty expands the shownotes on the focused episode card
    Then Shorty should see the expanded rich episode shownotes
    When Shorty opens the details of the focused episode card
    And Shorty opens the content tab in the episode details
    Then Shorty should see the rich episode content tab
    When Shorty opens the transcript tab in the episode details
    Then Shorty should see the rich episode transcript tab

  Scenario: Shorty uses article card shortcuts in the browser
    Given Shorty is signed in to infl0
    And Shorty has a rich article in the timeline
    And Shorty opens the timeline
    And Shorty starts reading
    When Shorty views the teaser of the rich article
    And Shorty uses the card flip shortcut
    Then Shorty should see the rich article back
    When Shorty uses the card escape shortcut
    Then Shorty should see the rich article teaser
    When Shorty uses the card flip shortcut
    Then Shorty should see the rich article back
    When Shorty uses the reader dialog shortcut
    Then Shorty should see the rich article body in the reader dialog
    When Shorty uses the reader dialog shortcut
    Then Shorty should not see an open reader dialog
    When Shorty uses the read-state shortcut on the focused card
    Then Shorty's focused card should be marked as read
    When Shorty uses the font-size shortcuts on the focused card
    Then Shorty's focused card font size should respond to shortcuts
    When Shorty uses the font-family shortcuts on the focused card
    Then Shorty's focused card font family should respond to shortcuts

  Scenario: Shorty uses episode card shortcuts in the browser
    Given Shorty is signed in to infl0
    And Shorty has a rich episode in the timeline
    And Shorty opens the timeline
    And Shorty starts reading
    When Shorty views the teaser of the rich episode
    And Shorty uses the card flip shortcut
    Then Shorty should see the rich episode back
    When Shorty uses the card escape shortcut
    Then Shorty should see the rich episode teaser
    When Shorty uses the card flip shortcut
    Then Shorty should see the rich episode back
    When Shorty uses the reader dialog shortcut
    Then Shorty should see the rich episode content tab
    When Shorty uses the reader dialog shortcut
    Then Shorty should not see an open reader dialog
    When Shorty uses the read-state shortcut on the focused card
    Then Shorty's focused card should be marked as read
    When Shorty uses the font-size shortcuts on the focused card
    Then Shorty's focused card font size should respond to shortcuts
    When Shorty uses the font-family shortcuts on the focused card
    Then Shorty's focused card font family should respond to shortcuts

  Scenario: Shorty toggles show-read from the timeline with a shortcut
    Given Shorty has reader articles
    And Shorty's first reader article is already read
    And Shorty opens the timeline
    When Shorty starts reading
    And Shorty uses the show-read timeline shortcut
    Then Shorty should see read articles hidden on the timeline
