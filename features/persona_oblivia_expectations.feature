@persona @screenplay @email
Feature: Oblivia recovery email and password reset
  Oblivia forgets her password but keeps a verified recovery address.
  She verifies that address in settings, signs out, and recovers access with
  one-time codes sent by email.

  Scenario: Oblivia verifies recovery email then resets a forgotten password
    Given Oblivia is signed in to infl0 without a verified recovery email
    When Oblivia opens account settings
    And Oblivia requests verification for a recovery email address
    Then Oblivia should receive a verification code for that recovery email
    When Oblivia confirms the verification code in account settings
    Then Oblivia should see the verified recovery email in account settings
    When Oblivia signs out of infl0
    And Oblivia starts password recovery with that recovery email
    Then Oblivia should receive a password recovery code for that recovery email
    When Oblivia confirms the recovery code and sets a new password
    Then Oblivia should be signed in to infl0

  Scenario: Oblivia can resend a recovery email verification code
    Given Oblivia is signed in to infl0 without a verified recovery email
    When Oblivia opens account settings
    And Oblivia requests verification for a recovery email address
    And Oblivia resends the verification code for that recovery email
    Then Oblivia should receive a verification code for that recovery email
    When Oblivia confirms the verification code in account settings
    Then Oblivia should see the verified recovery email in account settings

  Scenario: Oblivia cannot re-verify an already verified recovery email
    Given Oblivia had verified a recovery email in settings
    When Oblivia opens account settings
    And Oblivia tries to verify the same recovery email again
    Then Oblivia should be told that recovery email is already verified

  Scenario: Oblivia cannot recover without a verified recovery email
    Given Oblivia is signed in to infl0 without a verified recovery email
    When Oblivia signs out of infl0
    And Oblivia starts password recovery with an unverified recovery email
    Then Oblivia should be told recovery is not available yet

  Scenario: Oblivia cannot complete recovery with a wrong verification code
    Given Oblivia had verified a recovery email in settings
    And Oblivia is signed out of infl0
    When Oblivia starts password recovery with that recovery email
    And Oblivia enters an invalid recovery code
    Then Oblivia should not be signed in to infl0
