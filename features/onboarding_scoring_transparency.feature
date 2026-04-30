Feature: Scoring card explains algorithm transparency and control
  As a user familiar with social feed algorithms
  I want infl0 to explain scoring in transparent language
  So that I understand what influences my timeline and how to adjust it

  Background:
    Given I am signed in with a fresh onboarding account
    And I open the timeline
    And I focus the "scoring" onboarding card

  Scenario: Scoring front side uses familiar algorithm framing
    Then I should see wording that references "the algorithm"
    And I should see wording that infl0 is transparent and user-adjustable

  Scenario: Scoring back side nudges tracking activation
    When I flip the "scoring" onboarding card
    Then I should see that tracking is optional
    And I should see that enabling tracking can improve ranking quality

  Scenario: Scoring CTA opens sorting settings section
    Then I should see a CTA on the "scoring" card
    When I activate the scoring CTA
    Then I should land on "/settings#settings-sorting-heading"

  Scenario: Scoring full text includes all key explanation links
    When I open full text on the "scoring" onboarding card
    Then I should see a link to "/settings#settings-sorting-heading"
    And I should see a link to "/settings#settings-tracking-heading"
    And I should see a link to "/settings/personalization"
    And I should see wording that scores are recalculated after saving sorting settings
