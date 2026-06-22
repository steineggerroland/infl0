@persona @screenplay
Feature: knowledge-base-textwork

  Savy wants to extract knowledge from articles and episodes by capturing
  important quotes, summarizing sections, and adding personal notes.
  These source-bound reading notes support her understanding of the text.

  Background:
    Given Savy is logged in as a knowledge-base user
    And Savy has an article "The Future of AI" in her timeline for knowledge-base
    And Savy has opened the article "The Future of AI" for reading in knowledge-base

  @quote
  Scenario: Extract a quote from an article
    When Savy extracts a quote "Artificial intelligence will transform all industries" from the article
    Then Savy should see a quote highlighted in the article

  @summary
  Scenario: Summarize a section of an article
    When Savy writes a summary "AI has the potential to revolutionize healthcare and education" for the article
    Then Savy should see a summary highlighted in the article

  @note
  Scenario: Add a personal note to an article
    When Savy adds a note "Need to explore the ethical implications further" to the article
    Then Savy should see a note highlighted in the article

  @view-all
  Scenario: View all reading notes from an article
    Given Savy has extracted the following from "The Future of AI":
      | type    | content                                     |
      | quote   | AI will change everything                   |
      | summary | AI has potential in healthcare and education |
      | note    | Interesting perspective                      |
    When Savy opens the article "The Future of AI" again
    Then Savy should see 1 highlighted quote
    And Savy should see 1 highlighted summary
    And Savy should see 1 highlighted note

  @learning-focus
  Scenario: Work with the text in learning focus
    When Savy starts learning focus
    Then Savy should see learning focus guidance
    When Savy extracts a quote "Artificial intelligence will transform all industries" from the article
    Then Savy should see a quote highlighted in the article

  @overlapping-reading-notes
  Scenario: Highlight overlapping reading notes from their cards
    Given Savy has extracted the following from "The Future of AI":
      | type  | content                             |
      | quote | AI will change everything           |
      | note  | change everything. AI has potential |
    When Savy opens the article "The Future of AI" again
    And Savy hovers the reading note card "AI will change everything"
    Then Savy should see the active reading note highlight text "AI will change everything"
    When Savy hovers the reading note card "change everything. AI has potential"
    Then Savy should see the active reading note highlight text "change everything. AI has potential"

  @delete
  Scenario: Delete a reading note
    Given Savy has extracted the following from "The Future of AI":
      | type  | content                    |
      | quote | AI will transform industries |
    When Savy opens the article "The Future of AI" again
    And Savy deletes the highlighted quote "AI will transform industries"
    Then Savy should not see the highlighted quote "AI will transform industries"

  @filter-tag
  Scenario: Filter reading notes by tag
    Given Savy has reading notes with the following tags:
      | content    | tags   |
      | Fragment 1 | ai     |
      | Fragment 2 | ml     |
      | Fragment 3 | basics |
    When Savy navigates to the reading notes page filtered by tag "ai"
    Then Savy should see 1 reading note card

  @tags-index
  Scenario: Browse tag index
    Given Savy has reading notes with the following tags:
      | content    | tags   |
      | Fragment A | ai     |
      | Fragment B | ml     |
      | Fragment C | basics |
    When Savy navigates to the tags index
    Then Savy should see a tag "ai" with usage count 1
    And Savy should see a tag "ml" with usage count 1
    And Savy should see a tag "basics" with usage count 1

  @episode-quote
  Scenario: Extract a quote from an episode
    Given Savy has an episode "The Science of Sound" in her timeline
    When Savy opens the episode "The Science of Sound" for reading
    And Savy extracts a quote "Sound waves propagate through air" from the episode
    Then Savy should see a quote highlighted in the episode

  @global-reading-notes
  Scenario: See all reading notes globally
    Given Savy has extracted the following from "The Future of AI":
      | type  | content          |
      | quote | AI is the future |
      | note  | Thought provoking|
    When Savy navigates to the global reading notes page
    Then Savy should see 2 reading note cards
