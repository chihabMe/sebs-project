# SEBS Expansion v2 - Implementation Plan

## 1. Global UI & Infrastructure
- [ ] Install Shadcn/Radix components (Tabs, Table, Dialog, Sheet, Dropdown, Charts).
- [ ] Revamp **Header** (Add About Us, Services dropdown, refined mobile menu).
- [ ] Build **Footer** (Branded info, quick links, contact).
- [ ] Integrate **Resend** (Replace dummy email service with real API integration).

## 2. Advanced Admin Management
- [ ] **Backend**: Admin endpoints for User CRUD (Create user, Toggle status, Change role, Hard delete).
- [ ] **Frontend**: Admin Dashboard Layout with sidebar.
- [ ] **User Management**: Shadcn Table with sorting/filtering and "Create User" modal.
- [ ] **Event Oversight**: Centralized view to approve, reject, or archive any event.

## 3. Profile System (Private & Public)
- [ ] **Backend**: Analytics endpoint to fetch user attendance history (Attended vs. Missed).
- [ ] **Heatmap Logic**: Prepare data structure for GitHub-style attendance heatmap.
- [ ] **Private Profile**: Settings page for user details and security updates.
- [ ] **Public Profile**: Social view showing user stats, bio, and the heatmap.

## 4. Organizer Enhancements
- [ ] **Filtering**: Add "Past" vs "Upcoming" tabs to the Organizer Dashboard.
- [ ] **Lifecycle**: Ability to manually mark events as completed.

## 5. Security & Verification
- [ ] Audit frontend Protected Route wrappers for Admin/Organizer tiers.
- [ ] Ensure backend middlewares strictly enforce role-based access control (RBAC).
