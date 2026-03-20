---
title: Unified In-Modal Entry Flow Specification
version: 0.3-ready-for-implementation
date_created: 2026-03-19
last_updated: 2026-03-19
owner: TBD
tags: [design, inventory, modal, tanstack-form, keyboard-first]
---

# Introduction

This specification defines the planned redesign of the inventory entry modal (`in-modal`) to replace the current two-tab workflow with a single keyboard-first flow centered on the product code input. The goal is to unify "new product" and "existing product stock increase" into one operational path, reduce operator friction, and create a safer foundation for an eventual atomic batch submission flow.

## 1. Purpose & Scope

The purpose of this specification is to define the functional, UX, and technical requirements for a unified inventory entry experience.

Scope includes:

- Replacing the `Nuevo Producto` and `Aumentar Existencia` tabs with one form flow.
- Making the code field the primary decision point for whether the operator is creating a new product or increasing stock on an existing one.
- Preserving a keyboard-first operator workflow.
- Defining the future-safe constraints needed to support atomic batch submission.
- Identifying the remaining implementation-level ambiguities that must be closed before coding.

Out of scope for this phase:

- Implementing the backend transactional endpoint.
- Changing unrelated modal systems.
- Redesigning the global table system.
- Changing product search behavior outside the in-modal unless required by this unified flow.

## 2. Definitions

- **In-Modal**: Inventory entry modal used to create products or increase stock.
- **Unified Entry Flow**: Single form that supports both new-product creation and stock increase for existing products.
- **Code Input**: Primary field where the operator types or searches product code and/or description.
- **Existing Product Mode**: Form state reached when the code matches an existing product selection.
- **New Product Mode**: Form state reached when no existing product is selected and the operator proceeds with a code that does not resolve to an existing product.
- **Field Locking**: UX mechanism where description and price are visible but disabled by default for existing products, with an explicit unlock action to allow editing.
- **Pending Batch Item**: Item staged in the modal before final confirmation.
- **Atomic Batch Submission**: All items in the batch succeed or the entire operation fails with no partial persistence.
- **Keyboard-First**: Core flow must be operable without mouse interaction.
- **Command List**: Search results dropdown powered by the product search control.

## 3. Requirements, Constraints & Guidelines

### Functional Requirements

- **REQ-001**: The in-modal shall expose a single primary form instead of separate tabs for new and existing product flows.
- **REQ-002**: The first field shall be the product code field and it shall be the default focus target when the modal opens and after successfully adding an item to the batch.
- **REQ-003**: The code field shall support searching existing products by code and description using the current product-search command pattern.
- **REQ-004**: When the operator selects an existing product from the command list, the form shall enter Existing Product Mode.
- **REQ-005**: In Existing Product Mode, the form shall prefill description and current product data from the selected product.
- **REQ-006**: In Existing Product Mode, the operator shall be able to increase stock using a quantity field.
- **REQ-007**: In Existing Product Mode, the UI shall clearly indicate that the product already exists and that submission will create an inventory movement, not a new product row.
- **REQ-008**: When the operator types a code that does not resolve to an existing product and advances intentionally, the form shall enter New Product Mode.
- **REQ-009**: In New Product Mode, the typed code shall be preserved and reused as the product code for the pending item.
- **REQ-010**: In New Product Mode, the operator shall be able to fill description, price in USD, and initial stock.
- **REQ-011**: In Existing Product Mode, description and price fields shall remain visible and prefilled.
- **REQ-012**: In Existing Product Mode, description and price fields shall be disabled by default and may be made editable through an explicit unlock button reachable in the normal tab order.
- **REQ-013**: If the operator unlocks description and price for an existing product, the change shall affect the staged batch item and must remain visible in confirmation UI so the operator understands they are not using canonical values anymore.
- **REQ-014**: The pending batch table shall continue supporting mixed item types: new products and stock increases.
- **REQ-015**: The confirmation dialog shall continue summarizing mixed batch content in a way that makes item type explicit.
- **REQ-016**: Adding an item shall reset the form in a way that preserves the keyboard-first loop and returns focus to the code field.
- **REQ-017**: The modal shall block duplicate staging of the same existing product within the same batch.
- **REQ-018**: When duplicate staging is attempted, the UI shall provide clear feedback instructing the operator to remove the existing pending row and re-enter it with the new quantity.

### UX Requirements

- **UXR-001**: The visual structure shall communicate mode through form state, not through tabs.
- **UXR-002**: The form shall avoid layout jumps that break operator rhythm. Field presence may change by mode, but changes must feel stable and predictable.
- **UXR-003**: The current mode shall be visible using lightweight utility UI such as badge, helper text, or field locking state.
- **UXR-004**: The operator shall be able to complete the common path using keyboard only: type code, resolve mode, fill remaining fields, add item, repeat.
- **UXR-005**: The command dropdown shall preserve its current explicit-selection behavior. Exact matches shall not auto-select.
- **UXR-006**: Focus transitions shall be deterministic:
  - Exact existing selection -> next meaningful editable field for existing flow.
  - New product continuation -> description.
  - Post-submit -> code field.
- **UXR-007**: Validation and mode hints shall be concise and operator-oriented, not verbose.
- **UXR-008**: The form shall not reinterpret `Enter` or `Tab` as "continue as new" when the command list is active. The operator must either explicitly select an existing result or keep editing the code until no longer matching the undesired product.
- **UXR-009**: Field unlocking shall use a standard focusable button in the normal tab order so it remains explicit and keyboard-accessible without introducing a new shortcut contract.

### Atomicity & Data Integrity Requirements

- **DAT-001**: The unified modal redesign shall not deepen the current partial-success risk. The plan must remain compatible with replacing the current dual-mutation submit flow with a single backend transaction.
- **DAT-002**: Each staged batch item shall retain explicit type metadata so the confirmation and submit layers can distinguish between create-product and stock-increase operations.
- **DAT-003**: If an existing product is selected, the staged item shall reference the canonical `productId`.
- **DAT-004**: If a new product is staged, the staged item shall carry the proposed code, description, price, and initial stock as draft creation data.
- **DAT-005**: The planned backend target contract shall accept one mixed batch payload containing both new-product and existing-product operations within the same transaction.

### Constraints

- **CON-001**: The solution shall remain aligned with TanStack Form composition patterns already used in the codebase.
- **CON-002**: The solution shall preserve current design language unless a utility-first improvement materially improves operator speed or clarity.
- **CON-003**: The solution shall preserve keyboard shortcuts for confirming the batch, but shortcut handling must avoid conflicting with focused text inputs.
- **CON-004**: The solution shall not assume the backend is already atomic.
- **CON-005**: The solution shall support mobile rendering, but desktop keyboard-first flow is the priority interaction model.

### Guidelines

- **GUD-001**: Prefer derived mode from form state over duplicated local flags where possible.
- **GUD-002**: Keep the code field as the only branching decision input.
- **GUD-003**: Avoid hidden mutations of operator-entered code when switching between search and free-entry behavior.
- **GUD-004**: Exact code match shall still require explicit operator confirmation through the command flow.
- **GUD-005**: Use conservative prefill behavior for existing products so operators understand what is sourced from the database versus what is editable.
- **GUD-006**: Duplicate prevention should be implemented at the staging layer, not only as a visual warning.

## 4. Interfaces & Data Contracts

### Proposed Form State Contract

```ts
interface UnifiedInModalFormValues {
  code: string;
  selectedProductId: string;
  description: string;
  priceUsd: number | "";
  quantityOrInitialStock: number | "";
  isExistingFieldOverrideEnabled: boolean;
}
```

### Proposed Derived UI State

```ts
type UnifiedEntryMode = "unresolved" | "new" | "existing";

interface DerivedUnifiedEntryState {
  mode: UnifiedEntryMode;
  selectedProduct: ProductSearchResult | null;
  hasExactCodeMatch: boolean;
  hasDuplicatePendingItem: boolean;
  canStageNewItem: boolean;
  canStageExistingItem: boolean;
}
```

### Proposed Pending Batch Contract

```ts
type PendingBatchItem =
  | {
      type: "new";
      tempId: string;
      code: string;
      description: string;
      priceUsd: number;
      initialStock: number;
    }
  | {
      type: "existing";
      tempId: string;
      productId: string;
      code: string;
      description: string;
      addedQuantity: number;
      currentStock: number;
    };
```

### Proposed Interaction Contract

| Event                   | Preconditions                                        | Expected Result                                           |
| ----------------------- | ---------------------------------------------------- | --------------------------------------------------------- |
| Type code               | Modal open, code input focused                       | Search results appear when matches exist                  |
| Select existing product | Matching result chosen from command list             | Existing Product Mode activates and prefill occurs        |
| Continue as new product | No product selected and no undesired match is chosen | New Product Mode activates using the typed code           |
| Submit staged item      | Form valid for active mode                           | Pending batch item is added and form resets to code field |
| Submit duplicate item   | Existing product already staged in batch             | Item is rejected with clear duplicate feedback            |
| Confirm batch           | At least one pending item                            | Confirmation dialog summarizes mixed items                |

## 5. Acceptance Criteria

- **AC-001**: Given the modal opens, when the operator does nothing else, then focus is placed on the code field.
- **AC-002**: Given the operator types a code with matching products, when results are shown, then the operator can select a result using keyboard only.
- **AC-003**: Given an existing product is selected, when the form resolves to Existing Product Mode, then the UI visibly indicates existing-product behavior and exposes the stock-increase path.
- **AC-004**: Given no existing product is selected, when the operator continues with a code that is not explicitly selected from the command list, then the form resolves to New Product Mode without losing the typed code.
- **AC-005**: Given New Product Mode is active, when the operator completes description, price, and initial stock and submits, then a new-product pending batch item is added.
- **AC-006**: Given Existing Product Mode is active, when the operator enters an added quantity and submits, then an existing-product pending batch item is added.
- **AC-007**: Given Existing Product Mode is active, when the operator has not unlocked the editable fields, then description and price remain visible but disabled.
- **AC-008**: Given Existing Product Mode is active, when the operator unlocks editable fields, then description and price become editable without losing the selected product association.
- **AC-008A**: Given Existing Product Mode is active, when the operator tabs through the form, then the unlock button is reachable through normal keyboard navigation.
- **AC-009**: Given any item is added successfully, when the form resets, then focus returns to the code field.
- **AC-010**: Given the operator is typing in a text-capable field, when modal shortcuts are pressed, then shortcuts do not override expected text-input behavior.
- **AC-011**: Given the same existing product is already staged in the batch, when the operator tries to add it again, then the system blocks the action and explains how to correct it.
- **AC-012**: Given the batch contains both new and existing items, when the confirmation dialog opens, then each item type is clearly identified.
- **AC-013**: Given backend atomic submission is not yet implemented, when this UI redesign is shipped, then the submit layer remains compatible with later migration to a single transaction endpoint.

## 6. Test Automation Strategy

- **Test Levels**: Unit, integration, interaction-level UI tests.
- **Frameworks**: Vitest, React Testing Library.
- **Form Tests**:
  - Mode derivation from typed code and selected product.
  - Prefill behavior for existing product selection.
  - Disabled-by-default behavior for existing-product description and price.
  - Unlock behavior for existing-product editable fields.
  - Unlock button keyboard reachability through normal tab order.
  - New product preservation of typed code.
  - Focus order after select and after add.
  - Duplicate staging rejection for existing products.
- **Query/Data Tests**:
  - Existing product lookup hydration from product query data.
  - Submit payload mapping for mixed batch content.
- **Accessibility Tests**:
  - Keyboard-only completion of both paths.
  - Command list and status messaging semantics.
- **Regression Tests**:
  - Mixed batch confirmation rendering.
  - No accidental shortcut interception inside text inputs.
- **Coverage Requirements**: Focus on behavior-critical paths rather than snapshot quantity.

## 7. Rationale & Context

The current two-tab model maps technical implementation details into the operator interface. The client's requested flow indicates that the operator thinks in terms of one task: scan or type a code, then either recognize the product or complete missing data. The modal should mirror that mental model.

The code field is the strongest branch point because it is already the first piece of information the operator has. Using that field as the only entry decision reduces context switching and removes the need to choose a tab before the operator even knows whether the product already exists.

A unified flow also creates a cleaner path to solving the higher-severity architectural issue: non-atomic submission. Once the UI models staged items through one normalized contract, the backend can later consume the whole batch in one transactional call.

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: Supabase/Postgres-backed inventory data store for products and movements.

### Third-Party Services

- **SVC-001**: TanStack Query for product query caching and invalidation.
- **SVC-002**: TanStack Form for field composition, validation, and submission.
- **SVC-003**: Command-based search UI for existing product lookup.

### Infrastructure Dependencies

- **INF-001**: Current frontend mutation layer for batch creation and movement creation.
- **INF-002**: Future transactional backend endpoint for atomic mixed-batch inventory submission.

### Data Dependencies

- **DAT-101**: Product list data with `id`, `code`, `description`, `price_usd`, `stock`, and active status.

### Technology Platform Dependencies

- **PLT-001**: React 19 patterns already used in the project.
- **PLT-002**: Existing modal shell, data table, and shadcn-based UI primitives.

## 9. Examples & Edge Cases

```text
Case A: Existing product exact match
1. Operator types code.
2. Matching product appears.
3. Operator selects it with keyboard.
4. Form enters Existing Product Mode.
5. Description and price are shown from canonical data in disabled fields.
6. Operator enters added quantity.
7. Item is staged as type="existing".

Case B: New product
1. Operator types code.
2. No suitable result is selected.
3. Operator advances intentionally.
4. Form enters New Product Mode preserving typed code.
5. Operator fills description, price, stock.
6. Item is staged as type="new".

Case C: Ambiguous partial match
1. Operator types a partial code with 2-3 candidates.
2. System must not silently assume a candidate.
3. Operator must either select a candidate or keep editing the code until the undesired candidate is no longer relevant.

Case D: Existing product but operator wants to adjust description or price
1. Product exists.
2. Operator selects it.
3. Description and price are visible but disabled by default.
4. Operator may explicitly unlock those fields through a focusable button in the normal tab order.
5. Confirmation UI must make the override visible so the operator can review the divergence from canonical product data.

Case E: Duplicate pending staging
1. Operator adds the same existing product twice.
2. System blocks the second staging attempt.
3. Feedback tells the operator to remove the existing row and re-add it with the correct quantity.

Case F: Existing inactive product
1. Product exists but is inactive.
2. Product remains selectable for stock increase.
3. UI should visually communicate inactive status if feasible, but selection is allowed.
```

## 10. Validation Criteria

- The spec reflects explicit confirmation for existing-product selection.
- The spec reflects visible-but-disabled existing-product description and price fields with an unlock path.
- The spec reflects a normal-tab-order unlock button for existing-product description and price overrides.
- The spec reflects `description` as the next focus target for new-product flow.
- The spec reflects duplicate blocking for existing-product staging.
- The implementation plan includes a backend follow-up for atomic mixed-batch submission of one mixed batch.

## 11. Related Specifications / Further Reading

- Current in-modal implementation in `src/components/modals/in-modal/`
- Product search primitive in `src/components/product-search.tsx`
- TanStack Form composition used in `src/hooks/form.ts`

## 12. Resolved Stakeholder Decisions

1. Existing-product exact matches require explicit confirmation through the command flow. No auto-selection.
2. In Existing Product Mode, description and price remain visible and editable only after an explicit unlock action.
3. New-product focus order remains natural: `Code -> Description -> Price -> Stock`.
4. Duplicate staging of the same existing product is blocked.
5. Duplicate-attempt feedback must instruct the operator to remove the existing pending row and re-enter it with the corrected quantity.
6. Inactive products remain selectable for stock increase.
7. The command flow will not be altered to create a special "continue as new" gesture while results are active; the operator must keep editing the code or select explicitly.
8. The future transactional API target is one mixed batch payload.
9. Existing-product description and price unlocking uses `Option A`: an explicit unlock button in the normal tab order.

## 13. Implementation Readiness Note

This specification is now ready to drive implementation of the unified in-modal flow. The main remaining follow-up is not UX definition but engineering execution: the frontend refactor and the later backend work required to support a truly atomic mixed-batch submission path.
