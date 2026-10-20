# Changelog — Reload Staff Hub (frontend)

Each frontend update bumps `APP_VERSION` in `app.js` and the `?v=` values in `index.html`, and is recorded here.
Backend (`Code.gs`) versions are listed separately at the bottom.

## 2.26.0
- Translated the last Indonesian text: chip "All", "Show more", "+ New…", and the changelog row prefix "Row".
- Backend 2.18.0: changelog rows say "Row N" instead of "Baris N".
- The header alias "Sesi" stays in the backend on purpose, so the existing sheet header still works.

## 2.25.0
- A thin loading bar at the top appears while any request to the server is running.
- Buttons show a spinner while working: Log in, Save ("Saving..."), Delete ("Deleting...").
- Upload status shows a spinner.

## 2.24.0
- Shifts are now separate: M6 (06:00), M8 (08:00), M11 (11:00), MD12 (12:00), E2 (14:30). Set in `SHIFT_START`.
- The "Now" marker follows the exact start time.
- Existing rows with the old shift "M6 & M8" must be changed to M6 or M8 (Shift is now a dropdown).

## 2.23.0
- Upsell is grouped by shift (M6 & M8, M11 & MD12, E2), not by session. Each shift shows its own items.
- The shift running now is shown first and marked "Now". Shift start hours are set in `SHIFT_START`.

## 2.22.0
- Faster loading: sheet data is cached for 60 seconds on the server and cleared on every change.
- Requests time out after 20 seconds, with a clear message and a "Try again" button.
- A "Still loading" hint appears after 4 seconds.

## 2.21.1
- Missing data from the backend is treated as empty, so Home no longer goes blank.
- If a page fails to render, the error is shown on screen instead of a blank page.

## 2.21.0
- Upsell shows items only. Lines and rules are removed.
- The upsell sheet has the columns Date, Session, Shift, Item, Target, Unit.

## 2.20.0
- All user-facing text is now in English (labels, buttons, messages, errors).
- Upsell "Tipe" values changed: `Kalimat` is now `Line`, `Aturan` is now `Rule`. Update the existing cells in the `11_UpsellToday` sheet.

## 2.19.0
- Full "Our Guests" page, opened from "View all" on Home: search, category filter, sort, grid or list view, and "Show more" paging (12 per page).

## 2.18.0
- Greeting uses the HR nickname (falls back to first name).
- Our Guests on Home shows the 5 most recent guests, newest first.
- Tapping a guest photo opens a detail view. Long notes can be expanded with "Read more".
- Fix: Our Guests could error when guest data existed (regression in 2.17.0).

## 2.17.0
- Faster login: the HR employee list is cached for 10 minutes, and PINs are stored as hashes.
- Code cleanup: shared helpers for session-expired checks, grouped lists, day part, and sheet lookup.

## 2.16.0
- Photo and job title come from the HR sheet. The header shows photo, name, and job title.
- Important Info removed.
- Home shows three columns: Our Guests, Upsell Today, Staff Bulletin (stacked on mobile).
- Tabs: Home icon, Food Bible, Beverage Bible, SOP, Our Teams, Reload Academy, About Reload.

## 2.15.0
- Upsell no longer has a Status column. Home shows only rows dated today.

## 2.14.0
- Home layout: three columns on desktop, two on tablet, one on mobile. Larger tap targets on mobile.

## 2.13.0
- Upsell is per item: Type, Session, Shift, Item, Target, Unit, Status. Grouped by session.

## 2.12.0
- Upsell moved to its own sheet tab, `11_UpsellToday`.

## 2.11.0
- Loading states (skeleton and spinner). Inactive items folded under an "Inactive (N)" section.

## 2.10.0
- Photos and PDFs uploaded from the device. No more pasted Drive links.

## 2.9.0
- Forms use dropdowns, date pickers, and checkboxes instead of free typing.

## 2.8.0
- Two access modes shown in the header. Edit rights decided by the backend only.

## 2.7.0
- Brand palette and Poppins font. Logo added.

## 2.6.0
- Redesigned UI: profile header, pill tabs, grid cards, hero greeting.

## 2.5.0
- Add and delete rows, all through the backend. Deletes are logged in the changelog first.

## 2.4.0
- Edit rows in a form. Conflict check so newer changes are not overwritten.

## 2.3.0
- Frontend moved to GitHub Pages. Backend became a JSON API in Apps Script.

## Backend (Code.gs)
- 2.14.0: English messages and log text.
- 2.13.0: reads Nickname, Photo, and Job Title/Position from HR (optional columns).
- 2.12.0: faster login (cached HR index, hashed PINs), duplicate lookups removed.
- 2.11.0: Important Info removed from the app. HR photo and job title added.
- 2.10.0: Upsell rows have no Status column.
- 2.9.0: Upsell per item.
- 2.8.0: Upsell sheet tab added.
- 2.7.0: photo and PDF upload.
- 2.6.0: columns read by header name. One definition for edit rights.
- 2.5.0: add and delete rows.
- 2.4.0: conflict check on edit.
- 2.3.0: JSON API with a function whitelist.
- 2.2.0: NIK + PIN login, 6-hour session, 15-minute lock after 5 wrong PINs.
