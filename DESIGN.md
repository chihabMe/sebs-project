# SEBS Frontend Design & Architecture

This document outlines the UI structure, pages, and components required for the React.js (Vite + Tailwind CSS) frontend of the Smart Event Booking System (SEBS).

---

## 1. Global Components
Components that appear across multiple pages.

*   **Navbar**
    *   *Elements:* Logo, "Browse Events" link.
    *   *State-dependent Elements:*
        *   Unauthenticated: "Login" button, "Register" button.
        *   Authenticated (USER): "My Bookings" link, User Dropdown (Profile, Logout).
        *   Authenticated (ORGANIZER): "My Events" link, "Create Event" button, User Dropdown.
        *   Authenticated (ADMIN): "Admin Dashboard" link, User Dropdown.
*   **Footer**
    *   *Elements:* Copyright text, links to Terms of Service, Privacy Policy.
*   **Toast Notifications**
    *   *Purpose:* Global success/error messages (e.g., "Login successful", "Booking failed").

---

## 2. Public Pages

### 2.1. Home Page (`/`)
*   **Hero Section**
    *   *Elements:* Headline ("Find your next experience"), Subheadline, Search Input (by title), "Search" button.
*   **Featured Events Section**
    *   *Components:* EventCard (Image, Title, Date, Location, Price).
*   **Call to Action**
    *   *Elements:* "Are you an organizer? Register here" link.

### 2.2. Login Page (`/login`)
*   **Form**
    *   *Inputs:* Email (email type), Password (password type).
    *   *Buttons:* "Sign In" (submit).
    *   *Links:* "Don't have an account? Register".

### 2.3. Register Page (`/register`)
*   **Form**
    *   *Inputs:* Full Name, Email, Password.
    *   *Select:* Role Dropdown (Options: User, Organizer).
    *   *Buttons:* "Create Account" (submit).
    *   *Links:* "Already have an account? Login".

### 2.4. Browse Events Page (`/events`)
*   **Filters Sidebar/Top-bar**
    *   *Inputs:* Search Text, Category Dropdown, Date Picker (from/to), Price Range Slider.
*   **Event List/Grid**
    *   *Components:* List of EventCards.
    *   *State:* Loading spinner, Empty state message ("No events found").

### 2.5. Event Details Page (`/events/:id`)
*   **Header Section**
    *   *Elements:* Large Event Image, Title, Organizer Name, Tags (chips).
*   **Details Section**
    *   *Elements:* Date, Time, Location, Description.
*   **Action Card (Sticky)**
    *   *Elements:* Price, Tickets Remaining.
    *   *Buttons:* "Book Now" (Requires login, opens confirmation modal).
*   **Reviews Section**
    *   *Elements:* Average Rating (Stars), List of Review Components (User name, Rating, Comment).

---

## 3. Protected Pages (Role: USER)

### 3.1. User Dashboard (`/dashboard/bookings`)
*   **My Bookings List**
    *   *Components:* BookingCard (Event Title, Date, Status: Pending/Confirmed/Cancelled).
    *   *Buttons:* "Download Ticket" (PDF), "Cancel Booking", "Leave a Review" (only visible if Event Status is COMPLETED).

### 3.2. Leave Review Modal/Page (`/events/:id/review`)
*   **Form**
    *   *Inputs:* Star Rating selector (1-5), Comment text area.
    *   *Buttons:* "Submit Review", "Cancel".

---

## 4. Protected Pages (Role: ORGANIZER)

### 4.1. Organizer Dashboard (`/organizer`)
*   **Stats Overview**
    *   *Elements:* Total Events, Total Tickets Sold, Total Revenue.
*   **My Events List**
    *   *Components:* Event Management Table (Title, Date, Status, Tickets Sold, Actions).
    *   *Buttons:* "Edit", "View Attendees", "Cancel Event".

### 4.2. Create/Edit Event Page (`/organizer/events/new` or `/organizer/events/:id/edit`)
*   **Form**
    *   *Inputs:* Title, Description (textarea), Date & Time picker, Location, Category (select).
    *   *File Input:* Image Upload (drag & drop or click).
    *   *Inputs:* Tags (comma separated), Max Tickets (number), Price (number).
    *   *Buttons:* "Save Event" (submit), "Cancel".

### 4.3. Event Attendees List (`/organizer/events/:id/attendees`)
*   **Table**
    *   *Columns:* Attendee Name, Email, Booking Status, Booking Date.
    *   *Buttons:* "Export to CSV" (optional).

---

## 5. Protected Pages (Role: ADMIN)

### 5.1. Admin Dashboard (`/admin`)
*   **System Stats Overview**
    *   *Elements:* Total Users, Total Organizers, Total Events, Total Bookings.
*   **Pending Events Review**
    *   *Components:* List of events requiring approval.
    *   *Buttons:* "Approve", "Reject".

### 5.2. User Management (`/admin/users`)
*   **Users Table**
    *   *Columns:* Name, Email, Role, Status.
    *   *Buttons:* "Ban User", "Unban User", "Promote to Organizer".
