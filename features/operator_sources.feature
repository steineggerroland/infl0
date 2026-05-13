Feature: Operator source observability
  As an operator
  I want a protected overview of all source statuses
  So that I can quickly detect failing and high-risk sources

  Scenario: Non-operator users are denied
    Given I am signed in with a fresh onboarding account
    When I open the operator sources page
    Then I should see operator access denied

  @crawler
  Scenario: Operator can see summary and attention-first ordering
    Given I am signed in as seeded operator
    And the crawler API key is configured
    And I post operator source status fixtures
    When I open the operator sources page
    Then I should see the operator sources summary band
    And operator attention sources should be listed first
    And the operator sources table should show rows

  @crawler
  Scenario: Operator filters reduce the table to matching statuses
    Given I am signed in as seeded operator
    And the crawler API key is configured
    And I post operator source status fixtures
    When I open the operator sources page
    And I activate the operator filter "Blocked"
    Then the operator table should include source key "https://example.com/operator-blocked.xml"
    And the operator table should not include source key "https://example.com/operator-healthy.xml"
    When I activate the operator filter "Quiet"
    Then the operator table should include source key "https://example.com/operator-quiet.xml"
    And the operator table should not include source key "https://example.com/operator-blocked.xml"

