@pending @persona @screenplay
Feature: Integrator ingest observability expectations
  Ingo wants to know whether TopicKnowledgeCrawler delivery into infl0 is
  working and why individual requests failed.

  Scenario: Ingo sees that recent ingest requests are healthy
    Given Ingo is allowed to inspect integrator observability
    And the crawler has sent recent successful ingest requests
    When Ingo opens the integrator dashboard
    Then Ingo should see the latest ingest requests
    And Ingo should see that the last 10 requests are green

  Scenario: Ingo sees how many items each ingest request added
    Given Ingo is inspecting recent crawler delivery
    When Ingo opens an ingest request
    Then Ingo should see how many articles were accepted
    And Ingo should see how many episodes were accepted
    And Ingo should see how many subscribers were affected

  Scenario: Ingo can debug a rejected request with a wrong API key
    Given the crawler sent an ingest request with a wrong API key
    When Ingo opens the integrator dashboard
    Then Ingo should see a rejected request
    And Ingo should see that authentication failed
    And the crawler key itself should not be exposed

  Scenario: Ingo can debug a rejected request with invalid structure
    Given the crawler sent an ingest request with invalid structure
    When Ingo opens the rejected request details
    Then Ingo should see which validation failed
    And Ingo should see what infl0 received in a bounded request preview

  Scenario: Ingo can distinguish unsupported content from broken delivery
    Given the crawler sent a section payload that infl0 does not support yet
    When Ingo opens the rejected request details
    Then Ingo should see that the request reached infl0
    And Ingo should see that the content kind is unsupported rather than lost
