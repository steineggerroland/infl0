Feature: Reading behaviour and personalization surfaces
  As a privacy-aware reader
  I want the tracking control and the personalization explainer to be easy to reach
  So that I can review or adjust them deliberately

  Background:
    Given I am signed in with a fresh onboarding account
    And I use a wide viewport for the settings layout

  Scenario: Deep link opens reading-behaviour analysis
    When I open settings at "/settings#tracking"
    Then I should land on "/settings#tracking"
    And I should see the reading behaviour tracking toggle

  Scenario: The tracking toggle can be switched once
    Given I open the settings page
    When I open settings at "/settings#tracking"
    And I note whether reading behaviour tracking is enabled
    When I flip the reading behaviour tracking toggle
    Then the reading behaviour tracking toggle should differ from the noted state

  Scenario: Personalization page explains ranking at the top
    When I open the personalization page
    Then I should see the personalization page title
    And I should see the algorithm snapshot heading
