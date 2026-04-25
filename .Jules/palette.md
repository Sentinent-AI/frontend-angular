## 2024-04-25 - Contextual Action Buttons in Lists
**Learning:** Screen readers announce repetitive, generic action buttons like "Open", "Edit", "Delete", "Remove", "Resend", and "Archive" poorly when they are within lists (workspaces, members, decisions, signals), making it ambiguous which specific item the button acts upon.
**Action:** Always add dynamic `aria-label`s to generic list action buttons using Angular property binding (e.g., `[attr.aria-label]="'Edit ' + itemName"`) to provide clear, actionable context for screen reader users.
