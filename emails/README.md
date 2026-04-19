# Tanqi — Transactional email templates

These are the canonical, brand-aligned HTML templates for the emails Supabase
sends on Tanqi's behalf. Supabase ships with generic defaults that don't
carry any brand equity — these files fix that.

## Templates in this folder

| File | Supabase Auth template | Variables used |
| ---- | ---------------------- | -------------- |
| `confirm-signup.html` | **Confirm signup** | `{{ .ConfirmationURL }}`, `{{ .SiteURL }}` |
| `magic-link.html` | **Magic link** | `{{ .ConfirmationURL }}`, `{{ .SiteURL }}` |
| `password-reset.html` | **Reset password** | `{{ .ConfirmationURL }}`, `{{ .SiteURL }}` |
| `invite-user.html` | **Invite user** | `{{ .ConfirmationURL }}`, `{{ .SiteURL }}` |

## How to install

Supabase does not let you reference a hosted URL for email HTML — the body is
pasted directly into the Auth → **Email Templates** section of the project
dashboard. The workflow is:

1. Open the Supabase project → **Authentication** → **Email Templates**
2. Pick the template (e.g. *Magic Link*)
3. Open the matching file in this folder
4. Copy the **entire HTML file** (including `<html>` / `<body>`) into the
   *Message body (HTML)* field
5. Save. Supabase will use it on the next email it sends.

Repeat for every template above. Subject lines are kept in the comment at the
top of each HTML file so the full recipe lives in one place.

## Brand rules encoded here

- **Graphite + Electric Cyan.** The same palette as the app shell. Emails are
  a brand surface, not a system notification — they should feel like Tanqi.
- **Plus Jakarta Sans fallback stack.** Email clients can't load web fonts
  reliably, so the stack is `-apple-system, BlinkMacSystemFont, 'Segoe UI',
  sans-serif`. This keeps the hierarchy intact on Gmail, Apple Mail, and
  Outlook without requiring webfont loads.
- **One CTA per email.** Every template has a single cyan button and a fallback
  plain-text link for clients that strip styles.
- **Dark-friendly.** The design reads on both light and dark client chrome —
  no pure white backgrounds that flash in dark Gmail.
- **Accessible text sizes.** Body copy is 15px / 1.6 line-height; the button
  is 16px for touch targets on mobile clients.
- **Portuguese-first.** All copy is pt-BR, matching the product voice.

## Updating a template

When a brand token changes (e.g. the Electric Cyan moves from `#00D4F0` to a
new value) these files must be edited by hand and re-pasted into the Supabase
dashboard. Email HTML cannot consume CSS variables — the color has to be
inlined. Search for the hex values to find every occurrence.

Hex values used across the templates (mirrors `app/globals.css` comments):

```
#0E1015  background
#1C1F28  card
#2C303C  border
#FFFFFF  text / surface
#94A3B8  muted text
#00D4F0  Electric Cyan — primary accent
#0E1015  text on primary (same as background, for contrast)
```
