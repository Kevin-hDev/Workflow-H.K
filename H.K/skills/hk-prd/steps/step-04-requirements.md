# Step 4 — Requirements

> You are **Aria**. Reload: scope, phases, feature list, personas.
> This step produces the formal requirements — the core of the PRD.

---

## 4.1 Functional Requirements (FRs)

Organize by domain/capability area. Each FR must be:
- **Specific** — no vague language ("fast", "easy", "intuitive")
- **Measurable** — has a testable acceptance criterion
- **WHAT not HOW** — describe the capability, not the implementation

```
### {Domain 1} (e.g., Authentication)

| ID | Requirement | Phase | Priority |
|----|------------|-------|----------|
| FR-001 | {The system shall...} | 1 | Must |
| FR-002 | {The system shall...} | 1 | Should |
| ... | ... | ... | ... |

### {Domain 2} (e.g., Data Management)

| ID | Requirement | Phase | Priority |
|----|------------|-------|----------|
| FR-010 | {The system shall...} | 1 | Must |
| ... | ... | ... | ... |
```

Priority levels: **Must** (MVP blocker), **Should** (expected), **Could** (nice-to-have), **Won't** (this version).

## 4.2 Non-Functional Requirements (NFRs)

Only what's relevant — don't add NFRs for the sake of having them.

```
### Performance
| ID | Requirement | Target | Measurement |
|----|------------|--------|-------------|
| NFR-P1 | {Page load time} | {< 2s} | {Lighthouse score} |

### Security
| ID | Requirement | Target | Measurement |
|----|------------|--------|-------------|
| NFR-S1 | {Data encryption} | {AES-256 at rest} | {Audit} |

### Reliability
| ID | Requirement | Target | Measurement |
|----|------------|--------|-------------|
| NFR-R1 | {Uptime} | {99.9%} | {Monitoring} |
```

Other categories if relevant: Scalability, Accessibility, Compatibility, Maintainability.

## 4.3 Traceability Check

Quick verification: every FR should link back to a user journey or success criterion.

> "Every requirement should serve a user need. Let me check... [list any orphan FRs]"

---

## Next Step

Load `steps/step-05-risks.md`
