# ResolveIT — Postman API Guide

This guide explains how to test the ResolveIT backend using Postman and Newman.

---

## 1. Files Included

In the `postman/` directory, you will find two files:
1. `ResolveIT.postman_collection.json`: The full collection of all endpoints and an automated flow.
2. `ResolveIT-Local.postman_environment.json`: Environment variables pointing to `http://localhost:8080/api`.

---

## 2. Importing into Postman

1. Open Postman on your computer.
2. Click the **Import** button in the top left corner.
3. Drag and drop both JSON files from the `postman/` folder.
4. In the top right corner of Postman, select the environment named **ResolveIT Local Environment**.

---

## 3. How Authentication Works

- When you run **Auth -> Register** or **Auth -> Login**, a Postman test script automatically reads the JWT token from the response.
- It stores this token into the `{{token}}` environment variable.
- All other requests automatically send this token in the `Authorization: Bearer {{token}}` header.
- You do not need to copy and paste tokens manually.

---

## 4. Recommended Manual Testing Order

To test the system manually in Postman, run the requests in this order:

1. **Auth -> Login**: Login with the admin or demo user.
2. **Auth -> Me**: Verify your identity, role, and details.
3. **Complaints -> Create Complaint**: Submit a new ticket. The `complaintId` is saved automatically.
4. **Complaints -> List Complaints**: View the paginated list of tickets.
5. **Complaints -> Get Complaint**: View the full details of the ticket you just created.
6. **Complaints -> Change Status**: Transition the ticket from `OPEN` to `IN_PROGRESS` or `RESOLVED`.
7. **Comments -> Add Comment**: Post a comment to the ticket.
8. **History -> Get History**: Review the timeline of all status changes.
9. **Complaints -> Delete Complaint**: Remove an open complaint when needed.

### Admin Reassignment
An administrator can assign or reassign any complaint to an active agent or admin via `PATCH /api/complaints/:id/assign`, even if an assignee is already set. The previous assignee is automatically unassigned and receives HTTP 403 ("This complaint is not assigned to you") if they attempt further status transitions. Reassignment preserves the current complaint status and records an audit history entry with a note (`Reassigned from <old> to <new>`). Unassigning an `IN_PROGRESS` ticket resets its status back to `OPEN`.

### Live Notifications
The `Notifications` endpoints (`GET /api/notifications/unread` and `PATCH /api/notifications/:id/read`) power the live alert system. The unread endpoint returns up to 5 oldest unread notifications for the authenticated user. Recipients include the previous agent (`REASSIGNED_FROM_YOU`) and the newly assigned agent (`ASSIGNED_TO_YOU`). When a user reads or dismisses an alert popup, a PATCH call marks it as read (HTTP 204), preventing it from appearing on future polls.

---

## 5. Automated Flow with Newman

The collection includes a special folder called **Automated Flow (Newman)**.
This folder runs an end-to-end simulation from start to finish:
- Logs in as the administrator.
- Registers a new user and another user promoted to agent.
- Creates, filters, assigns, resolves, and reopens tickets.
- Verifies permission rules, audit history, and login lockout.

To run this automated flow from your terminal:

```bash
cd scripts
npx newman run ../postman/ResolveIT.postman_collection.json \
  --folder "Automated Flow (Newman)" \
  --environment ../postman/ResolveIT-Local.postman_environment.json \
  --env-var adminEmail=admin@resolveit.com \
  --env-var adminPassword=<your-admin-password>
```

---

## 6. What HTTP Status Codes Mean in ResolveIT

- **200 OK**: Request succeeded and returned data.
- **201 Created**: A new user, complaint, or comment was created.
- **204 No Content**: A resource was deleted successfully (e.g. DELETE complaint).
- **400 Bad Request**: Input validation failed (short title, missing field, or invalid status transition).
- **401 Unauthorized**: No token was provided or the token is expired/invalid.
- **403 Forbidden**: Your role or ownership does not allow this action (e.g. User trying to edit another user's complaint).
- **404 Not Found**: The requested ID does not exist in the database.
- **409 Conflict**: A business state prevents the action (e.g. duplicate email, or editing a non-OPEN complaint).
- **429 Too Many Requests**: Account locked due to 5 consecutive failed login attempts within 15 minutes.
- **500 Internal Server Error**: Unexpected server error. Check the backend console logs.
