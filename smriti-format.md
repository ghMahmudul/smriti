# Smriti Format Specification

**Project:** Smriti
**Extension:** `.todo`

## 1. Design goals

- **Human-readable and hand-editable.** A `.todo` file is fully
  understandable and safely editable in a plain text editor, with zero
  tooling.
- **Degrades gracefully.** An unrendered `.todo` file is still readable —
  nothing depends on a renderer to be usable.
- **Portable.** A `.todo` file is not tied to any single application.

## 2. Item structure

Each task item is made of up to five parts, which **MUST** appear in this order when present. All parts except the task line are optional.

1. Task line (required)
2. Metadata block
3. Body text
4. Nested subtasks
5. Attachments block

### 2.1 Task line

```
- [ ] Title text      (open)
- [x] Title text      (done)
```

Both states are core to Title is a single line of non-empty
UTF-8 text with no leading or trailing whitespace.

### 2.2 Metadata block

Immediately follows the task line (no blank line), indented one level
deeper than the task line's `- `. One field per line: `key: value`.

**Boundary rule:** a line belongs to the metadata block if and only if it
matches `^[a-z][a-z0-9_-]*: ` — a lowercase key, then `: `. The block ends
at the first line that doesn't match, or at the first blank line,
whichever comes first. This is a *shape* rule, not a *known-keys* rule.

### 3.3 Body text

One or more freeform paragraphs, separated from the metadata block (or
the task line) by exactly one blank line, and from each other by one
blank line. No inline formatting is mandated, though implementations MAY
support GFM inline syntax here.

### 3.4 Nested subtasks

Child task items, indented exactly one level (2 spaces) deeper than the
parent's `- `. Each child follows this same grammar recursively. No
maximum depth, though a UI MAY warn past a practical depth (e.g. 5).

### 3.5 Attachments block

```
attachments:
  - path: .todo/files/website-requirements.pdf
    name: Website Requirements
    type: application/pdf
    size: 245760
  - path: .todo/images/homepage-mockup.png
```

`attachments:` holds a **list**, even for a single file. `path` is
required and is resolved relative to a **`.todo/` directory at the root
of the task workspace** — the folder containing your `.todo` files — not
relative to the individual file. So `path: files/report.pdf` resolves to
`.todo/files/report.pdf`. Organizing attachments into subfolders like
`files/` and `images/` is a RECOMMENDED convention, not a requirement.
`name`, `type`, and `size` are OPTIONAL and SHOULD be derived from the
file itself when omitted.

## 4. Metadata fields (reserved keys)

| Key | Type | Requirement | Notes |
|---|---|---|---|
| `id` | string | RECOMMENDED | Stable identifier, generated once at creation, never reused. |
| `created` | ISO 8601 datetime | RECOMMENDED | |
| `modified` | ISO 8601 datetime | OPTIONAL | |
| `completed` | ISO 8601 datetime | RECOMMENDED when state is `[x]`; MUST NOT appear otherwise | |
| `due` | ISO 8601 **date** | OPTIONAL | Date only — a due date is a day, not an instant. |
| `remind` | ISO 8601 **datetime** | OPTIONAL | An instant, so it keeps the time component. |
| `priority` | enum: `low`, `medium`, `high` | OPTIONAL | |
| `tags` | comma-separated strings, no spaces | OPTIONAL | |
| `estimate` | integer + unit (`m`/`h`/`d`/`w`), e.g. `3d` | OPTIONAL | |
| `repeat` | recurrence string — see §5 | OPTIONAL | |
| `archived` | ISO 8601 datetime | OPTIONAL | Presence marks the task hidden from active views. Independent of task-line state — any state MAY be archived. |
| `trashed` | ISO 8601 datetime | OPTIONAL | Presence marks the task soft-deleted. Independent of task-line state. If both `archived` and `trashed` are present, implementations SHOULD treat `trashed` as taking precedence for display. |

### 4.1 Unknown reserved-shaped keys

A metadata line that matches the boundary pattern in §3.2 but uses a key
not in the table above is still metadata — just unrecognized. Conforming
parsers **MUST** preserve it on round-trip rather than discarding it or
misfiling it as body text. This is what keeps a parser correct even
on a file written against a later minor version that adds new keys.

## 5. Recurrence grammar (`repeat`)

```
repeat: every <n>? <unit> [on <weekday[,weekday...]>] [until <date> | count <n>]
```

`<unit>` ∈ `day`, `week`, `month`, `year`; `<n>` defaults to `1`. `on
<weekdays>` is valid only with `unit: week`. `until <date>` or
`count <n>` optionally bounds the series. Shorthand aliases `daily`,
`weekly`, `monthly`, `yearly` MAY be accepted and MUST be normalized to
their `every 1 <unit>` form.

## 6. Full example

Each feature below appears exactly once, building from the simplest
valid task to the richest one:

```
- [ ] Buy milk

- [ ] Pay office rent
  repeat: every 1 month

- [x] Old Q1 planning notes
  completed: 2026-01-15T00:00:00Z
  archived: 2026-02-01T09:00:00Z

- [ ] Duplicate task, added by mistake
  trashed: 2026-09-03T08:00:00Z

- [ ] Launch company website
  id: 01hq3z9k2p
  created: 2026-09-02T10:00:00Z
  due: 2026-09-15
  remind: 2026-09-09T09:00:00Z
  priority: high
  tags: business,website,launch
  estimate: 3d

  Prepare and launch the company website.

  The site should be tested on staging before deployment.

  - [x] Register domain
    completed: 2026-09-02T09:30:00Z

  - [ ] Design homepage
    estimate: 1d

  - [ ] Use the old hosting provider

    Switched to a different host instead.

  attachments:
    - path: .todo/files/website-requirements.pdf
      name: Website Requirements
      type: application/pdf
      size: 245760
    - path: .todo/images/homepage-mockup.png
```

Reading top to bottom: a bare task with nothing but a title, a recurring
task, an archived (and completed) task, a trashed task that's still
technically open, and finally one full task showing metadata, a
multi-paragraph body, two child tasks across two states,
and an attachments list with both a fully-described entry and a bare one.
