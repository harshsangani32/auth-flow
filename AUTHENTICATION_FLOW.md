# How Authorization Bearer Token Works

## Complete Authentication Flow

### Step 1: Admin Login (Get Token)

**Request:**
```http
POST /admin/verify-otp-login
Content-Type: application/json

{
  "email": "admin@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "admin": {
    "id": 1,
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMzYwMH0.xxxxx"
}
```

**What happens:**
- Server validates OTP
- Server generates JWT token containing `{ userId: admin.id, email: admin.email }`
- Token is signed with `JWT_SECRET` from environment variables
- Token expires in 1 hour (default) or as set in `JWT_EXPIRES_IN`

---

### Step 2: Using Token for Protected Routes

**Request:**
```http
POST /admin/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMzYwMH0.xxxxx
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "isVerified": false
}
```

---

## How `authenticateToken` Middleware Works

### Code Flow:

```typescript
// 1. Extract Authorization Header
const authHeader = req.headers.authorization;
// Example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// 2. Check if header exists
if (!authHeader) {
  return res.status(401).json({ error: "Authorization header is required" });
}

// 3. Extract token (remove "Bearer " prefix if present)
const token = authHeader.startsWith("Bearer ")
  ? authHeader.substring(7)  // Remove "Bearer " (7 characters)
  : authHeader;
// Result: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// 4. Verify token signature and decode payload
const decoded = verifyToken(token);
// verifyToken() uses jwt.verify() to:
//   - Check token signature matches JWT_SECRET
//   - Check if token is expired
//   - Return decoded payload: { userId: 1, email: "admin@example.com" }

// 5. Attach user info to request object
req.user = decoded;
// Now req.user = { userId: 1, email: "admin@example.com" }

// 6. Continue to next middleware/controller
next();
```

---

## Step-by-Step Breakdown

### 1. **Client sends request with token**
```
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. **Middleware extracts token**
- Checks for `Authorization` header
- Removes `"Bearer "` prefix (if present)
- Gets the actual JWT token string

### 3. **Token verification**
- Uses `jwt.verify(token, JWT_SECRET)` from `jsonwebtoken` library
- Verifies:
  - ✅ Token signature is valid (signed with correct secret)
  - ✅ Token is not expired
  - ✅ Token format is correct

### 4. **Decode payload**
- If valid, extracts payload: `{ userId: 1, email: "admin@example.com" }`
- If invalid, throws error (expired, tampered, wrong secret, etc.)

### 5. **Attach to request**
- Sets `req.user = { userId: 1, email: "admin@example.com" }`
- Controller can access `req.user.userId` and `req.user.email`

### 6. **Controller uses authenticated user**
```typescript
export const addUserController = async (req: AuthRequest, res: Response) => {
  // req.user is now available!
  if (!req.user) {
    return res.status(401).json({ error: "Admin not authenticated" });
  }
  
  // You can use req.user.userId to identify which admin made the request
  const adminId = req.user.userId; // = 1
  const adminEmail = req.user.email; // = "admin@example.com"
  
  // ... rest of controller logic
}
```

---

## Error Scenarios

### ❌ Missing Authorization Header
```http
POST /admin/users
(no Authorization header)
```
**Response:** `401 Unauthorized - "Authorization header is required"`

### ❌ Invalid Token Format
```http
POST /admin/users
Authorization: Bearer invalid-token-format
```
**Response:** `401 Unauthorized - "Invalid token"`

### ❌ Expired Token
```http
POST /admin/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (expired)
```
**Response:** `401 Unauthorized - "jwt expired"`

### ❌ Tampered Token (wrong signature)
```http
POST /admin/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (modified)
```
**Response:** `401 Unauthorized - "invalid signature"`

### ✅ Valid Token
```http
POST /admin/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (valid)
```
**Response:** `201 Created - User created successfully`

---

## Testing with cURL

```bash
# 1. Login and get token
curl -X POST http://localhost:5000/admin/verify-otp-login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","otp":"123456"}'

# Response contains token, save it:
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 2. Use token for protected route
curl -X POST http://localhost:5000/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "isVerified": false
  }'
```

---

## Testing with Postman/Thunder Client

1. **Login Request:**
   - Method: `POST`
   - URL: `http://localhost:5000/admin/verify-otp-login`
   - Body (JSON):
     ```json
     {
       "email": "admin@example.com",
       "otp": "123456"
     }
     ```
   - Copy the `token` from response

2. **Protected Request:**
   - Method: `POST`
   - URL: `http://localhost:5000/admin/users`
   - Headers:
     - `Authorization`: `Bearer <paste-token-here>`
     - `Content-Type`: `application/json`
   - Body (JSON):
     ```json
     {
       "firstName": "John",
       "lastName": "Doe",
       "email": "john@example.com",
       "password": "password123",
       "isVerified": false
     }
     ```

---

## Security Notes

1. **Token Storage:** Store token securely (not in localStorage for production, use httpOnly cookies)
2. **HTTPS:** Always use HTTPS in production to prevent token interception
3. **Token Expiry:** Tokens expire after 1 hour (configurable via `JWT_EXPIRES_IN`)
4. **Secret Key:** Keep `JWT_SECRET` secure and never commit it to version control
5. **Token Refresh:** Consider implementing token refresh mechanism for better UX

---

## Summary

The Bearer token authentication works like this:

1. **Login** → Get JWT token
2. **Include token** in `Authorization: Bearer <token>` header
3. **Middleware validates** token signature and expiry
4. **If valid** → Attach user info to `req.user` and proceed
5. **If invalid** → Return 401 Unauthorized

The token proves the admin is authenticated without sending credentials on every request!

