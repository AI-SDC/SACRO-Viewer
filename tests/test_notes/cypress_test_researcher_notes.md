# Researcher View E2E Test Coverage

## Researcher View Test Coverage

| action | condition type | condition | assessed by test name |
|--|--|--|--|
| Visit researcher workflow | precondition | application is reachable | `beforeEach` |
| Click Researcher | precondition | Researcher role is available | `beforeEach` |
| Click Researcher | postcondition | output list loads with at least one item | `beforeEach` |
| Click add output | precondition | researcher session loaded | `can perform the full output lifecycle (add, edit, rename, delete)` |
| Click add output | precondition | add output modal opens | `can perform the full output lifecycle (add, edit, rename, delete)` |
| Confirm add output | postcondition | output created successfully (HTTP 200) | `can perform the full output lifecycle (add, edit, rename, delete)` |
| Confirm add output | postcondition | output appears in output list | `can perform the full output lifecycle (add, edit, rename, delete)` |
| Click edit output | precondition | output has been selected | `can perform the full output lifecycle (add, edit, rename, delete)` |
| Change output type to regression | precondition | edit form visible | `can perform the full output lifecycle (add, edit, rename, delete)` |
| Confirm output type edit | postcondition | server accepts edit (HTTP 200) | `can perform the full output lifecycle (add, edit, rename, delete)` |
| Confirm output type edit | postcondition | output type updated to regression | `can perform the full output lifecycle (add, edit, rename, delete)` |
| Click rename output | precondition | edit dialog visible | `can perform the full output lifecycle (add, edit, rename, delete)` |
| Confirm rename | postcondition | rename request succeeds (HTTP 200) | `can perform the full output lifecycle (add, edit, rename, delete)` |
| Confirm rename | postcondition | output displayed under new name | `can perform the full output lifecycle (add, edit, rename, delete)` |
| Click delete output | precondition | renamed output exists | `can perform the full output lifecycle (add, edit, rename, delete)` |
| Confirm delete | postcondition | delete request succeeds (HTTP 200) | `can perform the full output lifecycle (add, edit, rename, delete)` |
| Confirm delete | postcondition | output removed from list | `can perform the full output lifecycle (add, edit, rename, delete)` |
| Select output | precondition | output exists in list | `can manage comments (add, edit, delete)` |
| Select output | postcondition | researcher form loads | `can manage comments (add, edit, delete)` |
| Add comment | precondition | comment field available | `can manage comments (add, edit, delete)` |
| Add comment | postcondition | new comment displayed | `can manage comments (add, edit, delete)` |
| Edit comment | precondition | comment exists | `can manage comments (add, edit, delete)` |
| Edit comment | postcondition | updated comment displayed | `can manage comments (add, edit, delete)` |
| Delete comment | precondition | comment exists | `can manage comments (add, edit, delete)` |
| Delete comment | postcondition | comment removed | `can manage comments (add, edit, delete)` |
| Select output | precondition | output exists in list | `can add an exception request` |
| Select output | postcondition | researcher form loads | `can add an exception request` |
| Add exception request | precondition | exception input field available | `can add an exception request` |
| Add exception request | postcondition | exception request displayed | `can add an exception request` |
| Click save draft | precondition | save draft button visible | `can save a draft session` |
| Click save draft | postcondition | save request returns HTTP 200 | `can save a draft session` |
| Click finalize | precondition | finalize button visible | `can complete the finalize workflow` |
| Enter session name | precondition | finalize modal visible | `can complete the finalize workflow` |
| Check cell counts confirmation | precondition | cell counts checkbox available | `can complete the finalize workflow` |
| Check identifiers confirmation | precondition | identifiers checkbox available | `can complete the finalize workflow` |
| Check output types confirmation | precondition | output types checkbox available | `can complete the finalize workflow` |
| Check confirmation acknowledgement | precondition | confirmation checkbox available | `can complete the finalize workflow` |
| Confirm finalize | postcondition | finalize request returns HTTP 200 | `can complete the finalize workflow` |
| Confirm finalize | postcondition | finalize modal closes | `can complete the finalize workflow` |
