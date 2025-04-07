# Project Context: Open Massage App MVP

## 1. Project Brief

### 1.1. Objective
Create a mobile-first app tailored for massage practitioners and freelancers in Singapore. The app will allow individual massage providers to list their services and accept simple booking requests from potential clients. The initial focus is solely on the listing and basic booking (request and accept) functionalities.

### 1.2. Target Users
- **Massage Practitioners/Freelancers:** Individuals offering massage services who want to market themselves and manage bookings.
- **Clients:** Users looking for massage services in Singapore who prefer a simple, streamlined booking process.

---

## 1.3. Tech Stack
- **Frontend**: React Native with TypeScript, Expo, and Expo Router
- **Backend/Database**: Supabase
- **UI Framework**: React Native Paper
- **AI Processing**: DeepSeek

---

## 1.4. Database Schema
### Tables
- **Users**
  - id: UUID (Primary Key)
  - name: String
  - email: String (Unique)
  - password: String
  - role: Enum ('practitioner', 'client')

- **Services**
  - id: UUID (Primary Key)
  - user_id: UUID (Foreign Key to Users)
  - title: String
  - description: String
  - price: Decimal
  - specialties: Array of Strings

- **Bookings**
  - id: UUID (Primary Key)
  - service_id: UUID (Foreign Key to Services)
  - client_id: UUID (Foreign Key to Users)
  - booking_date: DateTime
  - status: Enum ('pending', 'accepted', 'declined')
  - special_requests: String

---

## 1.5. Optimal Folder Structure
```
/app
  /components
    /Common
    /Service
    /User
  /screens
    /Home
    /ServiceDetails
    /Booking
  /hooks
  /assets
    /images
    /fonts
  /constants
  /navigation
  /utils
  /services
```

## 2. Minimum Viable Product (MVP) Requirements

### 2.1. Core Feature: Provider Listings
- **Display:**
  - Provider photo
  - Name
  - Massage specialties
  - Ratings/Reviews
- **Filtering (Post-MVP Consideration):**
  - Location
  - Massage specialty

### 2.2. Core Feature: Booking Request Process
- **Client Action: Initiate Request:**
  - Simple form with fields: Date, Time, Short message.
- **Provider Action: Respond to Request:**
  - Mechanism to view incoming requests.
  - Options to Accept or Decline.
- **System Action: Status Updates & Notifications:**
  - Notify provider of new requests.
  - Notify client of provider's response (Accepted/Declined).
  - Indicate booking status (Pending, Accepted, Declined).

### 2.3. User Interface & Experience (UI/UX)
- **Design:** Mobile-first, clean, responsive layout.
- **Navigation:** Intuitive and simple for both user types.

---

## 3. MVP Focus Summary

This MVP focuses on validating the core functionality: enabling practitioners to list services and clients to request bookings simply. Further features depend on feedback and validation.

## 1.6. App Flow

### 1.6.1. Welcome Screen
- **Purpose**: To greet users and provide an entry point into the app.
- **Elements**:
  - App logo
  - Welcome message
  - Buttons for "Login" and "Sign Up"

### 1.6.2. Login/Sign Up Screen
- **Purpose**: To allow users to access their accounts or create a new account.
- **Elements**:
  - Input fields for email and password
  - "Login" button
  - "Sign Up" link for new users
  - Option to reset password

### 1.6.3. Main Dashboard
- **Purpose**: To serve as the central hub for users to navigate the app.
- **Elements**:
  - Navigation bar (Home, Services, Bookings, profile)
  - Quick access buttons for common actions (e.g., "Book a Service", "View My Services")
  - Notifications area for updates and messages