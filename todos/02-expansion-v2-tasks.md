# SEBS Expansion v2 - Detailed Task List

**Development Rules:**
- Check off (`[x]`) each sub-feature as it is completed.
- Make an **atomic git commit** immediately after completing each sub-feature.
- Use **simple, short, imperative commit messages** (e.g., `feat: add review form`, `fix: admin table sort`).

---

## 1. Reviews System (Frontend)
- [x] Create frontend API client functions for reviews (`src/api/reviews.ts`).
  - *Commit:* `feat: add reviews api client`
- [ ] Build `ReviewList` component to display existing event reviews.
  - *Commit:* `feat: create review list component`
- [ ] Build `ReviewForm` component to allow users to submit a rating and comment.
  - *Commit:* `feat: create review form component`
- [ ] Integrate Reviews UI (List & Form) into `EventDetailsPage.tsx`.
  - *Commit:* `feat: integrate reviews into event details`

## 2. Profile System & Attendance Heatmap
- [ ] Create backend analytics endpoint to fetch user attendance history (Attended vs. Missed).
  - *Commit:* `feat: add attendance analytics endpoint`
- [ ] Build GitHub-style attendance Heatmap component.
  - *Commit:* `feat: build attendance heatmap component`
- [ ] Add Edit Profile form (update bio, avatar, details) and integrate with backend API.
  - *Commit:* `feat: add edit profile functionality`
- [ ] Build Public Profile view/page showing user stats and heatmap to others.
  - *Commit:* `feat: add public profile page`

## 3. Advanced Admin Management
- [ ] Install/Configure `Table` Shadcn component.
  - *Commit:* `chore: add table ui component`
- [ ] Refactor `AdminDashboardPage.tsx` to use the Table for users, including sorting and filtering.
  - *Commit:* `feat: upgrade admin user table`
- [ ] Build "Create User" modal for Admins and wire up the backend API call.
  - *Commit:* `feat: add admin create user modal`

## 4. Organizer Dashboard Enhancements
- [ ] Install/Configure `Tabs` Shadcn component.
  - *Commit:* `chore: add tabs ui component`
- [ ] Add "Upcoming" vs "Past" filtering tabs to `OrganizerDashboardPage.tsx`.
  - *Commit:* `feat: add event filtering tabs`
- [ ] Add UI action for organizers to manually mark an event lifecycle as `COMPLETED`.
  - *Commit:* `feat: allow organizers to complete events`

## 5. Global UI & Infrastructure Polish
- [ ] Revamp Header (Add About Us, Services dropdown, refined mobile menu).
  - *Commit:* `feat: revamp global header navigation`
- [ ] Integrate Resend (Replace dummy email service with real API integration in `email.service.ts`).
  - *Commit:* `feat: integrate resend api`
