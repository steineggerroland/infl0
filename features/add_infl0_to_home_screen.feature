Feature: Add infl0 to your home screen
  As a reader who uses infl0 in the browser
  I want to install infl0 like an app on my phone or computer
  So I can open my timeline from the home screen with the right name, icon, and shortcuts

  @http-only
  Scenario: Install listing shows infl0's name and what the app is for
    When I look up how infl0 presents itself for installation
    Then the install listing should name the app "infl0"
    And readers should see an English description of calm, private reading from personal sources
    And German readers should see the same message in German
    And infl0 should open in its own window without browser toolbars
    And infl0 should work in portrait and landscape

  @http-only
  Scenario: Home-screen shortcuts open timeline, sources, and settings
    When I look up how infl0 presents itself for installation
    Then I should be able to jump to the timeline from the home screen
    And I should be able to jump to managing sources from the home screen
    And I should be able to jump to settings from the home screen

  @http-only
  Scenario: Icons and in-place updates are ready for an installed app
    When I look up how infl0 presents itself for installation
    Then the install listing should include infl0's app icons
    And installed infl0 should be able to receive updates without a store

  Scenario: Sign-in page supports adding infl0 on a phone
    Given I start as a signed-out visitor
    When I open the login page
    Then the page should tell the browser how to install infl0
    And the page should be laid out for a phone-sized screen
