# LOGISS Dispatcher Console — Design Documentation

## 1. Pages List

1.  **Operations**: Real-time KPI dashboard and summary view.
2.  **Bookings**: Request queue for medical trip approvals.
3.  **Live Trips**: Stylized map tracking of active fleet.
4.  **Drivers**: Fleet directory and compliance management.
5.  **Applications**: Driver onboarding request review.
6.  **Reports**: Incident and safety report management.
7.  **Trip History**: Searchable archive of all fleet activities.
8.  **Settings**: Global system and profile configuration.

## 2. User Flow (Step-by-Step)

### Booking Approval Flow

- **Entry**: Operations (Landing) → Click "View all" in Awaiting Approval.
- **Action**: Bookings → Select specific request card.
- **Action**: Detail Panel → Review trip/rider info → Click "Approve & Assign".
- **Action**: Selection Panel → Click available driver card → Click "Assign".
- **Result**: Trip status updates to "Assigned" → Removed from Pending Review tab.

### Driver Application Flow

- **Entry**: Operations → Click "View all" in Applications.
- **Action**: Applications → Select applicant card.
- **Action**: Detail Panel → Review documents → Click "Approve & Onboard".
- **Result**: Driver profile created → Redirect to Drivers page.

### Incident Resolution Flow

- **Entry**: Operations → Click "View all" in Open Reports.
- **Action**: Reports → Select incident card.
- **Action**: Detail Panel → Review parties/description → Click "Mark Resolved".
- **Result**: Report moved to "Resolved" tab.

### Error/Cancellation Flows

- **Booking Rejection**: Bookings → Select request → Click "Reject Booking" → Prompt confirm → Deleted.
- **Application Rejection**: Applications → Select app → Click "Reject" → Status changed to Rejected.

## 3. Screen Details

### Operations (Dashboard)

- **Components**: KPI Strip (4 cards), Live Trip Card, Upcoming Today List, Quick View Sidebars (Bookings, Apps, Reports).
- **Inputs**: Global Search.
- **Buttons**: "View all →", "Call", "Msg", "View Details".

### Bookings

- **Components**: Status Tabs, Request List, Detail Panel, Route Timeline, Driver Selection List (Modal state).
- **Inputs**: Global Search.
- **Buttons**: "Approve & Assign", "Reject Booking", "Call Rider", "Select Available Driver", "Cancel", "Assign".

### Live Trips

- **Components**: Active Trip List, Will Call Queue, Stylized SVG Map, Selected Trip Detail Card.
- **Inputs**: Global Search.
- **Buttons**: "Call Rider", "Call Driver", "Emergency", "Message Dispatch", "Dispatch Return Trip", "Zoom +", "Zoom -".

### Drivers

- **Components**: Status Tabs, Driver List, Detail Panel, Document Status Grid, Today's Stats Grid.
- **Inputs**: Global Search.
- **Buttons**: "+ Onboard New Driver", "Call Driver", "Email", "Full Profile".

### Applications

- **Components**: Application List, Detail Panel, Progress Timeline, Document Checklist.
- **Inputs**: Global Search.
- **Buttons**: "Approve & Onboard", "Request More Info", "Reject".

### Reports

- **Components**: Severity Tabs, Report List, Detail Panel, Related Trip Card.
- **Inputs**: Global Search.
- **Buttons**: "Mark Resolved", "Dismiss Report", "Contact Parties".

### Trip History

- **Components**: KPI Stat Row, Search/Filter Bar, Data Table.
- **Inputs**: Search Input.
- **Buttons**: "All", "Active", "Completed", "Cancelled", "Row (Chevron)".

### Settings

- **Components**: Profile Card, Hotline Card, County Pills, Notification Toggle List, Version Info.
- **Inputs**: Notification Toggles.
- **Buttons**: "Edit Profile", "+ Add County", "Sign Out".

## 4. Button Action Map

| Button Name             | Action                         | Redirect / Result                                 |
| :---------------------- | :----------------------------- | :------------------------------------------------ |
| **NavItem (Sidebar)**   | Set active page state          | Switch to corresponding Page component            |
| **"View all →" (Ops)**  | Set active page state          | Redirect to Bookings/Apps/Reports                 |
| **"Approve & Assign"**  | Open driver selection list     | Show available on-duty drivers                    |
| **"Assign"**            | Link driver to trip ID         | Close selection; Update trip status to "Assigned" |
| **"Reject Booking"**    | Set trip status to "Cancelled" | Remove from Pending list                          |
| **"Approve & Onboard"** | Create new Driver entry        | Redirect to Drivers page; Add to "All" list       |
| **"Mark Resolved"**     | Update report status           | Move from "Open" to "Resolved" tab                |
| **"Emergency"**         | Trigger critical alert state   | Open emergency communication overlay              |
| **"Dispatch Return"**   | Move trip from Will Call       | Update status to "Assigned" (Return Leg)          |
| **"Sign Out"**          | Clear local session            | Redirect to hypothetical Login (Auth placeholder) |

## 5. States

1.  **Loading**: Global fade-in overlay (300ms transition).
2.  **Empty**: "No data found" placeholder with icon and descriptive text.
3.  **Error**: Toast notification or red-tinted alert card for missing fields/failed actions.
4.  **Success**: Confirmation badge or status change (Amber → Blue/Green).

## 6. Navigation

- **Main Navigation**: Left-fixed sidebar (sticky) for cross-module jumping.
- **Back Behavior**: Simple state-based navigation; clicking a sidebar item resets page level.
- **Cross-page Links**: Action buttons on Dashboard link directly to specific modules (Bookings, Drivers, etc.).
- **Drill-down**: Selecting a list item updates the `selectedId` state for the persistent Detail Panel.
