# Package: return context and onboarding completion

## Status

Draft

## Goal

Navigation away from the inflow and back should feel stable and predictable.
Users should return to the card/article context they just had, instead of being
thrown to a different position or the first onboarding card.

Define a clear onboarding completion model that is understandable for users and
consistent with the same return behavior used for normal article reading.

## Non-goals

- Reworking timeline ranking logic itself.
- Full redesign of onboarding copy or card visuals.
- Introducing mandatory tutorial flows.

## Dependencies

- Timeline/inflow focus state handling.
- Onboarding card state model (`topic`, surface state).
- UI preferences/session persistence strategy.

## Acceptance criteria

1. Returning from `Settings`, `Help`, or `Feeds` restores the last meaningful
   context in inflow (onboarding card or article), with deterministic fallback.
2. If the previously focused item is no longer available (e.g. filtered), users
   land on a nearest sensible neighbor instead of jumping to unrelated content.
3. Onboarding completion behavior is explicitly defined (when onboarding is
   considered seen/completed, and how users re-enter onboarding if needed).
4. Behavior is documented in product terms and covered by behavioral tests.

## Implementation notes

- Keep implementation details minimal; prioritize explicit behavior rules and
  fallback order.
- Include risks around read-filter side effects and list reordering after
  navigation.
- Rollback path: disable new restore behavior via feature flag or preference.

## Links

- PR:
- Discussion:
