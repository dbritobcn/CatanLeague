## ADDED Requirements

### Requirement: Responsive branded navigation
The application SHALL present the approved forest-green and ivory identity with a desktop sidebar, compact tablet rail and mobile bottom navigation. Every route SHALL have a visible label, selected state and keyboard focus.

#### Scenario: Changing device width
- **WHEN** the viewport changes between desktop, tablet and mobile
- **THEN** all three existing sections remain reachable without page-level horizontal overflow or obscured controls.

### Requirement: Real league standings
The application SHALL show actual players, scores, matches played and provisional final positions, with actual schedule progress and context-sensitive actions.

#### Scenario: No league has started
- **WHEN** the league is in registration
- **THEN** standings display setup guidance and an action to manage participants instead of fictitious ranking data.

#### Scenario: Compact standings
- **WHEN** standings are displayed on mobile
- **THEN** position, player, points and matches played remain visible and finishing counts remain available through an expandable section.

### Requirement: Preserve league administration
The application SHALL preserve registration, removal, start, result recording/correction, automatic final and restart workflows, including existing confirmations and domain validation.

#### Scenario: League lifecycle
- **WHEN** a user registers enough players, starts the league and records results
- **THEN** standings and schedule update, the final is generated and a recorded final identifies the champion under the existing rules.

### Requirement: Accessible interaction feedback
Forms SHALL have named fields, pending feedback, announced error/success messages and visible keyboard focus. Touch controls SHALL have at least 44px targets.

#### Scenario: Invalid registration
- **WHEN** a duplicate player name is submitted
- **THEN** the domain error appears visibly and is announced without losing the input or hiding the submit control.
