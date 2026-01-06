# Registration Form Update - Role-Based Dynamic Fields

## Summary
Updated the registration form to display different input fields based on the selected user role (Driver vs Passenger), matching the backend database model requirements.

## Changes Made

### 1. Registration Form UI ([app/auth/register.tsx](app/auth/register.tsx))
- Added new state fields for role-specific data:
  - `nic`: National Identity Card (required for both roles)
  - `route`: Route assignment (Driver only)
  - `vehicleNumber`: Vehicle registration number (Driver only)

- Implemented conditional field rendering:
  - **Common fields** (shown for both roles):
    - Name
    - Email
    - Role Selector (Dropdown)
    - Phone Number
    - NIC (National Identity Card)
    - Password
    - Confirm Password
  
  - **Driver-specific fields** (shown only when role = 'DRIVER'):
    - Route
    - Vehicle Number
  
- Enhanced validation:
  - Checks that all role-specific required fields are filled
  - Driver validation: name, email, phone, nic, route, vehicleNumber, password
  - Passenger validation: name, email, phone, nic, password

### 2. API Types ([lib/api/types.ts](lib/api/types.ts))
Updated `RegisterDataSchema` to include new optional fields:
- `nic`: string (optional in schema, but required by validation)
- `route`: string (optional, required for drivers)
- `vehicleNumber`: string (optional, required for drivers)

### 3. API Client ([lib/api/client.ts](lib/api/client.ts))

#### Driver Registration Flow:
- Validates all required driver fields: email, phone, nic, route, vehicleNumber
- Maps frontend fields to backend expected format:
  - `phone` → stays as `phone` in request body
  - `nic` → maps to `licenseNumber` in request
  - `vehicleNumber` → maps to `busId` in request
  - `route` → maps to `routeId` in request
- Calls: `POST /api/gps/driver/register`
- On success, automatically logs in the driver
- Error handling for duplicate drivers (409) and validation errors (400)

#### Passenger Registration Flow:
- Validates required passenger fields: phone, nic
- Maps frontend fields to backend User model format:
  - `phone` → maps to `telephone` in database
  - `nic` → stays as `nic` in database
- Calls: `POST /api/users`
- Creates user record in MongoDB User collection

## Backend Integration

### Driver Model (MongoDB)
Required fields: `name`, `email`, `password`, `route`, `nic`, `telephone`, `vehicleNumber`

### User Model (MongoDB)
Required fields: `name`, `email`, `password`, `telephone`, `nic`

### API Endpoints
- **Driver Registration**: `POST /api/gps/driver/register`
  - Body: `{ name, email, password, phone, licenseNumber, busId, routeId }`
  
- **Passenger Registration**: `POST /api/users`
  - Body: `{ name, email, password, telephone, nic }`

## User Experience Flow

1. User opens registration screen
2. User selects role from dropdown (Driver or Passenger)
3. Form dynamically shows/hides fields based on selection:
   - **Driver selected**: Shows Route and Vehicle Number fields
   - **Passenger selected**: Only shows common fields
4. User fills in all required fields
5. On submit:
   - Frontend validates all role-specific fields
   - Sends request to appropriate backend endpoint
   - On success, automatically logs in user
   - On error, displays clear error message

## Testing Recommendations

1. **Driver Registration**:
   - Test with all required fields filled
   - Test validation errors (missing route, vehicle number, etc.)
   - Test duplicate email/NIC error handling

2. **Passenger Registration**:
   - Test with all required fields filled
   - Test validation errors (missing phone, NIC)
   - Test duplicate email/NIC error handling

3. **UI/UX**:
   - Switch between roles and verify fields appear/disappear
   - Verify field labels are clear and helpful
   - Test form data persistence when switching roles
