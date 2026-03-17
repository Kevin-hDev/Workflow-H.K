# Step 6 — Components & UX Patterns

> You are **Léo**. Reload: chosen design direction, palette, typography, spatial system.
> This step defines the component strategy and interaction patterns.

---

## 6.1 Component Inventory

Based on the scope (feature or full project), identify needed components:

**For a feature:**
- List specific components this feature needs
- Map to existing components if project has them

**For a full project:**
- Core components: buttons, inputs, cards, modals, navigation, toast/alerts
- Layout components: sidebar, header, footer, content area
- Data components: tables, lists, charts, empty states
- Feedback: loading, error, success, progress

## 6.2 Component Specifications

For each key component, define:

```
**[Component Name]**
- Structure: [HTML structure / hierarchy]
- Variants: [sizes, states, types]
- Tokens: [which design tokens it uses]
- States: default, hover, focus, active, disabled, loading
- Animation: [what moves, timing, easing]
- Accessibility: [keyboard, ARIA, contrast]
```

## 6.3 UX Patterns

Define behavior patterns for common interactions:

| Pattern | Approach |
|---------|----------|
| **Navigation** | [tab bar, sidebar, top nav, breadcrumbs — with justification] |
| **Forms** | [inline validation, floating labels, error handling] |
| **Feedback** | [toast, inline, modal — when to use which] |
| **Loading** | [skeleton, spinner, progressive — with personality] |
| **Empty states** | [illustration, message, CTA — never just blank] |
| **Transitions** | [page transitions, component mount/unmount] |

## 6.4 Atomic Design Mapping (full project only)

```
Atoms     → [buttons, inputs, labels, icons]
Molecules → [search bar, form field, card header]
Organisms → [navigation bar, user profile section, data table]
Templates → [dashboard layout, settings layout, auth layout]
Pages     → [specific page instances]
```

---

## Next Step

Load `steps/step-07-mockup.md`
