# How POST /attendance/mark API Works

## Complete Request Flow Diagram

```
Client Request
    ↓
[POST /attendance/mark]
[Authorization: Bearer <token>]
[Content-Type: multipart/form-data]
[Body: FormData with type, photo, faceDescriptor, useCloudVision]
    ↓
┌─────────────────────────────────────────┐
│ 1. Route Handler                        │
│    /attendance/mark                     │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 2. authenticateToken Middleware         │
│    - Extracts token from header         │
│    - Verifies JWT token                 │
│    - Attaches user info to req.user     │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 3. uploadSingleImage Middleware         │
│    - Parses multipart/form-data         │
│    - Extracts file from "photo" field    │
│    - Stores in memory (buffer)          │
│    - Attaches to req.file               │
│    - Max size: 5MB                      │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 4. markAttendanceController             │
│    - Validates authentication           │
│    - Extracts form fields               │
│    - Validates type (IN/OUT)            │
│    - Parses faceDescriptor              │
│    - Calls markAttendance service       │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 5. markAttendance Service               │
│    - Verifies user exists               │
│    - Uploads image to Cloudinary        │
│    - Performs face recognition          │
│    - Creates attendance record          │
│    - Saves to database                  │
└─────────────────────────────────────────┘
    ↓
Response JSON with attendance data
```

---

## Step-by-Step Detailed Flow

### Step 1: Client Sends Request

**Request Format:**
```http
POST /attendance/mark HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="type"

IN
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="photo"; filename="attendance.jpg"
Content-Type: image/jpeg

[binary image data]
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="faceDescriptor"

[0.123,0.456,0.789,...]
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="useCloudVision"

false
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

**JavaScript Example:**
```javascript
const formData = new FormData();
formData.append('type', 'IN');
formData.append('photo', imageFile);
formData.append('faceDescriptor', JSON.stringify([0.123, 0.456, ...]));
formData.append('useCloudVision', 'false');

fetch('http://localhost:5000/attendance/mark', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

---

### Step 2: Route Handler (`src/routes/attendance.routes.ts`)

```typescript
router.post(
  "/mark",
  authenticateToken,      // Middleware 1: Authentication
  uploadSingleImage,       // Middleware 2: File upload
  markAttendanceController // Controller: Process request
);
```

**What happens:**
- Express routes the request to this handler
- Middlewares are executed in order (left to right)
- Controller is called last

---

### Step 3: Authentication Middleware (`authenticateToken`)

**File:** `src/middleware/auth.middleware.ts`

```typescript
export const authenticateToken = (req, res, next) => {
  // 1. Extract Authorization header
  const authHeader = req.headers.authorization;
  // Result: "Bearer eyJhbGciOiJIUzI1NiIs..."

  // 2. Extract token
  const token = authHeader.substring(7); // Remove "Bearer "
  // Result: "eyJhbGciOiJIUzI1NiIs..."

  // 3. Verify token
  const decoded = verifyToken(token);
  // Result: { userId: 1, email: "user@example.com" }

  // 4. Attach to request
  req.user = decoded;
  // Now req.user = { userId: 1, email: "user@example.com" }

  // 5. Continue to next middleware
  next();
};
```

**If authentication fails:**
- Returns `401 Unauthorized`
- Request stops here

**If successful:**
- `req.user` contains decoded token data
- Proceeds to next middleware

---

### Step 4: File Upload Middleware (`uploadSingleImage`)

**File:** `src/middleware/upload.middleware.ts`

```typescript
export const uploadSingleImage = multer({
  storage: multer.memoryStorage(), // Store file in memory as buffer
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
}).single("photo"); // Expect single file with field name "photo"
```

**What happens:**
1. **Multer parses multipart/form-data:**
   - Extracts all form fields
   - Extracts file from `"photo"` field
   - Stores file in memory as Buffer

2. **Attaches to request:**
   ```typescript
   req.file = {
     fieldname: 'photo',
     originalname: 'attendance.jpg',
     encoding: '7bit',
     mimetype: 'image/jpeg',
     buffer: Buffer<...>, // Binary image data
     size: 245678
   }
   ```

3. **Form fields are in `req.body`:**
   ```typescript
   req.body = {
     type: 'IN',
     faceDescriptor: '[0.123,0.456,...]', // As string
     useCloudVision: 'false'
   }
   ```

**If file is too large (>5MB):**
- Returns `400 Bad Request`
- Request stops here

**If successful:**
- `req.file` contains file data
- `req.body` contains form fields
- Proceeds to controller

---

### Step 5: Controller (`markAttendanceController`)

**File:** `src/controllers/attendance.controller.ts`

```typescript
export const markAttendanceController = async (req: AuthRequest, res: Response) => {
  // 1. Check authentication
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" });
  }
  // req.user = { userId: 1, email: "user@example.com" }

  // 2. Extract form data
  const { type, faceDescriptor, useCloudVision } = req.body;
  // type = "IN"
  // faceDescriptor = "[0.123,0.456,...]" (string)
  // useCloudVision = "false" (string)

  // 3. Validate type
  if (!type || (type !== "IN" && type !== "OUT")) {
    return res.status(400).json({ error: "Type must be either 'IN' or 'OUT'" });
  }

  // 4. Parse face descriptor (if provided)
  let parsedFaceDescriptor: number[] | undefined;
  if (faceDescriptor) {
    if (typeof faceDescriptor === "string") {
      // Parse JSON string to array
      parsedFaceDescriptor = JSON.parse(faceDescriptor);
      // Result: [0.123, 0.456, 0.789, ...]
    } else if (Array.isArray(faceDescriptor)) {
      // Already an array
      parsedFaceDescriptor = faceDescriptor;
    }
  }

  // 5. Call service function
  const result = await markAttendance(
    req.user.userId,        // 1
    type,                   // "IN"
    req.file,               // File object or undefined
    parsedFaceDescriptor,    // [0.123, 0.456, ...] or undefined
    useCloudVision === true || useCloudVision === "true" // false
  );

  // 6. Return response
  res.status(201).json({
    message: `Attendance marked as ${type} successfully`,
    attendance: result.attendance,
    faceRecognition: result.faceRecognition,
  });
};
```

---

### Step 6: Service Function (`markAttendance`)

**File:** `src/services/attendance.service.ts`

#### 6.1: Verify User Exists

```typescript
const user = await userRepo.findOne({ where: { id: userId } });
if (!user) {
  throw new Error("User not found");
}
```

#### 6.2: Process Image (if provided)

```typescript
if (file) {
  // 6.2.1: Upload to Cloudinary
  imageUrl = await uploadImageToCloudinary(file);
  // Result: "https://res.cloudinary.com/diiemespy/image/upload/v1234567890/attendance-photos/xyz.jpg"

  // 6.2.2: Perform Face Recognition
  if (useCloudVision) {
    // Option A: Google Cloud Vision API
    faceRecognitionResult = await verifyFaceWithCloudVision(file.buffer);
  } else if (faceDescriptor && faceDescriptor.length > 0) {
    // Option B: face-api.js descriptor
    faceRecognitionResult = await verifyFaceWithDescriptor(
      faceDescriptor,
      storedDescriptor || undefined
    );
  } else {
    // Option C: Basic verification
    faceRecognitionResult = await basicFaceVerification(file.buffer);
  }
}
```

**Image Upload Process:**
```typescript
const uploadImageToCloudinary = (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 1. Create upload stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "attendance-photos",
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          return reject(error);
        }
        // 2. Return secure URL
        resolve(result.secure_url);
      }
    );

    // 3. Pipe buffer to Cloudinary
    Readable.from(file.buffer).pipe(uploadStream);
  });
};
```

**Face Recognition Process:**

**Option A: face-api.js (Offline)**
```typescript
verifyFaceWithDescriptor(faceDescriptor, storedDescriptor)
```
- Calculates Euclidean distance between descriptors
- Threshold: 0.6 (lower = better match)
- Returns: `{ verified: true, confidence: 0.85, method: "face-api.js" }`

**Option B: Cloud Vision API**
```typescript
verifyFaceWithCloudVision(file.buffer)
```
- Sends image buffer to Google Cloud Vision API
- Detects faces in image
- Returns: `{ verified: true, confidence: 0.7, method: "cloud-vision" }`

**Option C: Basic Verification**
```typescript
basicFaceVerification(file.buffer)
```
- Just checks if image exists
- Returns: `{ verified: true, confidence: 0.5, method: "basic" }`

#### 6.3: Create Attendance Record

```typescript
const attendance = attendanceRepo.create({
  user,                    // User entity
  type,                    // "IN" or "OUT"
  timestamp: new Date(),   // Current timestamp
  imageUrl,                // Cloudinary URL or null
  faceVerified: faceRecognitionResult?.verified || false,
  faceRecognitionData: JSON.stringify({
    verified: true,
    confidence: 0.85,
    method: "face-api.js"
  })
});

const savedAttendance = await attendanceRepo.save(attendance);
```

**Database Record Created:**
```sql
INSERT INTO attendance (
  userId, type, timestamp, imageUrl, faceVerified, faceRecognitionData
) VALUES (
  1, 'IN', '2024-01-15 10:30:00', 
  'https://res.cloudinary.com/.../attendance-photos/xyz.jpg',
  true,
  '{"verified":true,"confidence":0.85,"method":"face-api.js"}'
);
```

#### 6.4: Return Result

```typescript
return {
  attendance: savedAttendance,
  faceRecognition: faceRecognitionResult
};
```

---

### Step 7: Response Sent to Client

**Success Response (201 Created):**
```json
{
  "message": "Attendance marked as IN successfully",
  "attendance": {
    "id": 1,
    "type": "IN",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "imageUrl": "https://res.cloudinary.com/diiemespy/image/upload/v1234567890/attendance-photos/xyz.jpg",
    "faceVerified": true,
    "faceRecognitionData": "{\"verified\":true,\"confidence\":0.85,\"method\":\"face-api.js\"}"
  },
  "faceRecognition": {
    "verified": true,
    "confidence": 0.85,
    "method": "face-api.js"
  }
}
```

**Error Response Examples:**

**401 Unauthorized:**
```json
{
  "error": "User not authenticated"
}
```

**400 Bad Request (Invalid type):**
```json
{
  "error": "Type must be either 'IN' or 'OUT'"
}
```

**400 Bad Request (User not found):**
```json
{
  "error": "User not found"
}
```

---

## Complete Example Flow

### Example 1: Mark IN with Image Only

**Request:**
```javascript
const formData = new FormData();
formData.append('type', 'IN');
formData.append('photo', imageFile);

fetch('/attendance/mark', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

**Flow:**
1. ✅ Authentication passes
2. ✅ Image uploaded to Cloudinary
3. ✅ Basic face verification (just checks image exists)
4. ✅ Attendance record created
5. ✅ Response returned

---

### Example 2: Mark OUT with Face Recognition

**Request:**
```javascript
const formData = new FormData();
formData.append('type', 'OUT');
formData.append('photo', imageFile);
formData.append('faceDescriptor', JSON.stringify([0.123, 0.456, ...]));

fetch('/attendance/mark', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

**Flow:**
1. ✅ Authentication passes
2. ✅ Image uploaded to Cloudinary
3. ✅ Face descriptor parsed from JSON string
4. ✅ Face recognition performed (Euclidean distance calculation)
5. ✅ Attendance record created with `faceVerified: true`
6. ✅ Response returned with recognition results

---

### Example 3: Mark IN with Cloud Vision API

**Request:**
```javascript
const formData = new FormData();
formData.append('type', 'IN');
formData.append('photo', imageFile);
formData.append('useCloudVision', 'true');

fetch('/attendance/mark', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

**Flow:**
1. ✅ Authentication passes
2. ✅ Image uploaded to Cloudinary
3. ✅ Image buffer sent to Google Cloud Vision API
4. ✅ Face detection performed server-side
5. ✅ Attendance record created
6. ✅ Response returned

---

## Key Points

1. **Authentication is Required:**
   - Token must be valid
   - User must exist in database

2. **Image is Optional:**
   - Can mark attendance without image
   - If image provided, it's uploaded to Cloudinary

3. **Face Recognition is Optional:**
   - Can work without face recognition
   - Supports multiple methods (face-api.js, Cloud Vision, basic)

4. **Timestamp is Automatic:**
   - Set automatically when record is created
   - Uses server time

5. **Type Must be IN or OUT:**
   - Validated in controller
   - Case-sensitive

6. **Face Descriptor Format:**
   - Can be JSON string: `"[0.123,0.456,...]"`
   - Can be array: `[0.123,0.456,...]`
   - Controller handles both formats

---

## Testing with Different Tools

### cURL
```bash
curl -X POST http://localhost:5000/attendance/mark \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "type=IN" \
  -F "photo=@/path/to/image.jpg" \
  -F "faceDescriptor=[0.123,0.456]" \
  -F "useCloudVision=false"
```

### Postman
1. Method: `POST`
2. URL: `http://localhost:5000/attendance/mark`
3. Headers:
   - `Authorization: Bearer YOUR_TOKEN`
4. Body: `form-data`
   - `type`: `IN`
   - `photo`: (File) Select image
   - `faceDescriptor`: `[0.123,0.456,...]` (optional)
   - `useCloudVision`: `false` (optional)

### JavaScript Fetch
```javascript
const formData = new FormData();
formData.append('type', 'IN');
formData.append('photo', imageFile);
formData.append('faceDescriptor', JSON.stringify(descriptorArray));

const response = await fetch('http://localhost:5000/attendance/mark', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(result);
```

---

This is how the `/attendance/mark` API works from request to response! 🎯






