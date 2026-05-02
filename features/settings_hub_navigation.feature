Feature: Settings hub navigation
  As someone tuning infl0
  I want deep links and the section sidebar to take me to the right block
  So that I do not hunt through one long settings page

  Background:
    Given I am signed in with a fresh onboarding account
    And I use a wide viewport for the settings layout

  Scenario: Deep link opens the light or dark block
    When I open settings at "/settings#display-appearance"
    Then I should land on "/settings#display-appearance"
    And I should see the appearance settings control

  Scenario: Deep link opens the sorting section
    When I open settings at "/settings#sorting"
    Then I should land on "/settings#sorting"
    And I should see the sorting section heading

  Scenario: Hub sidebar link jumps to the colour palette block
    Given I open the settings page
    When I follow the settings hub link "display-palette"
    Then I should land on "/settings#display-palette"
    And I should see the theme settings control
