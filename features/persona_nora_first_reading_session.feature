@persona @screenplay
Feature: Nora first reading session
  Nora wants to move from onboarding into a deliberate reading session
  so that she understands where she is and can return to her place.

  Scenario: Nora sees the onboarding journey before regular reading
    Given Nora is a new reader
    When Nora registers for infl0
    Then Nora should be welcomed with onboarding cards
    And Nora's onboarding cards should appear before regular articles
    And Nora's onboarding topics should be ordered

  Scenario: Nora learns how cards work from the intro card
    Given Nora is a new reader
    When Nora registers for infl0
    And Nora focuses the "intro" onboarding card
    Then Nora should see intro guidance to flip the card
    When Nora flips the "intro" onboarding card
    Then Nora should see intro guidance to keep moving and open full text
    When Nora opens full text on the "intro" onboarding card
    Then Nora should see intro full-text guidance

  Scenario: Nora returns to the same onboarding card after reload
    Given Nora is a new reader
    When Nora registers for infl0
    And Nora focuses the "scoring" onboarding card
    Then Nora's URL should point to the "scoring" onboarding card
    When Nora reloads infl0
    Then Nora should return to the "scoring" onboarding card

  Scenario: Nora can finish onboarding from a later card
    Given Nora is a new reader
    When Nora registers for infl0
    And Nora finishes onboarding from the "sources" card
    Then Nora's onboarding should be finished

  Scenario: Nora starts her first reading session deliberately
    Given Nora is a new reader
    When Nora registers for infl0
    And Nora learns the onboarding basics
    And Nora finishes onboarding from the "sources" card
    And Nora adds their first source
    And new content arrives for Nora's source
    And Nora starts their first reading session
    Then Nora should read the first current article deliberately
    When Nora returns to infl0 from Help
    Then Nora should continue at that article
