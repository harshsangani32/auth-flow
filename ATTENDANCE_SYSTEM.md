# Attendance System Documentation

## Overview

The attendance system allows users to mark their attendance (IN/OUT) with:
- Image upload support
- Camera snapshot capability
- Face recognition using face-api.js (offline) or Google Cloud Vision API
- Automatic timestamp capture

## Database Schema

### Attendance Entity
- `id`: Primary key
- `user`: Foreign key to User entity
- `type`: "IN" or "OUT"
- `timestamp`: Automatic timestamp when attendance is marked
- `imageUrl`: Cloudinary URL of the uploaded/snapshot image
- `faceVerified`: Boolean indicating if face recognition was successful
- `faceRecognitionData`: JSON string storing face recognition results

## API Endpoints

### 1. Mark Attendance

**Endpoint:** `POST /attendance/mark`

**Authentication:** Required (Bearer token)

**Request:**
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: multipart/form-data`
- **Body (Form Data):**
  - `type`: "IN" or "OUT" (required)
  - `photo`: Image file (optional, for image upload)
  - `faceDescriptor`: JSON array of face descriptor from face-api.js (optional)
  - `useCloudVision`: Boolean string "true"/"false" (optional, default: false)

**Response:**
```json
{
  "message": "Attendance marked as IN successfully",
  "attendance": {
    "id": 1,
    "type": "IN",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "imageUrl": "https://res.cloudinary.com/...",
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

### 2. Get User Attendance Records

**Endpoint:** `GET /attendance`

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `startDate`: Optional (ISO date string)
- `endDate`: Optional (ISO date string)

**Response:**
```json
{
  "message": "Attendance records retrieved successfully",
  "attendance": [
    {
      "id": 1,
      "type": "IN",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "imageUrl": "https://...",
      "faceVerified": true
    }
  ],
  "count": 1
}
```

### 3. Get Today's Attendance

**Endpoint:** `GET /attendance/today`

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "message": "Today's attendance retrieved successfully",
  "attendance": [...],
  "count": 2
}
```

## Frontend Integration Examples

### Using face-api.js (Offline Face Recognition)

#### 1. Install face-api.js

```bash
npm install face-api.js
```

#### 2. Load Models

```javascript
// Load face-api.js models
import * as faceapi from 'face-api.js';

// Load models (you need to download these from face-api.js repository)
await Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models')
]);
```

#### 3. Capture Image and Detect Face

```javascript
// Option 1: From Camera
async function captureFromCamera() {
  const video = document.getElementById('video');
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  
  // Capture frame
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  
  // Detect face and get descriptor
  const detection = await faceapi
    .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();
  
  if (detection) {
    return {
      image: canvas.toDataURL('image/jpeg'),
      descriptor: Array.from(detection.descriptor)
    };
  }
  throw new Error('No face detected');
}

// Option 2: From File Input
async function processImageFile(file) {
  const image = await faceapi.bufferToImage(file);
  const detection = await faceapi
    .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();
  
  if (detection) {
    return {
      image: file,
      descriptor: Array.from(detection.descriptor)
    };
  }
  throw new Error('No face detected');
}
```

#### 4. Mark Attendance with Face Recognition

```javascript
async function markAttendance(type, imageFile, faceDescriptor) {
  const formData = new FormData();
  formData.append('type', type); // 'IN' or 'OUT'
  formData.append('photo', imageFile);
  formData.append('faceDescriptor', JSON.stringify(faceDescriptor));
  
  const response = await fetch('http://localhost:5000/attendance/mark', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: formData
  });
  
  return await response.json();
}

// Usage
const result = await captureFromCamera();
const attendance = await markAttendance('IN', result.image, result.descriptor);
console.log('Attendance marked:', attendance);
```

### Using Image Upload Only (No Face Recognition)

```javascript
async function markAttendanceWithImage(type, imageFile) {
  const formData = new FormData();
  formData.append('type', type);
  formData.append('photo', imageFile);
  
  const response = await fetch('http://localhost:5000/attendance/mark', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: formData
  });
  
  return await response.json();
}
```

### Using Google Cloud Vision API

```javascript
async function markAttendanceWithCloudVision(type, imageFile) {
  const formData = new FormData();
  formData.append('type', type);
  formData.append('photo', imageFile);
  formData.append('useCloudVision', 'true');
  
  const response = await fetch('http://localhost:5000/attendance/mark', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: formData
  });
  
  return await response.json();
}
```

## Complete Frontend Example (React)

```jsx
import React, { useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

function AttendanceMarking() {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(false);

  // Start camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Mark attendance
  const markAttendance = async (type) => {
    setLoading(true);
    try {
      // Capture frame
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      // Detect face
      const detection = await faceapi
        .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        alert('No face detected. Please try again.');
        setLoading(false);
        return;
      }

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append('type', type);
        formData.append('photo', blob, 'attendance.jpg');
        formData.append('faceDescriptor', JSON.stringify(Array.from(detection.descriptor)));

        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/attendance/mark', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const result = await response.json();
        if (response.ok) {
          alert(`Attendance marked as ${type} successfully!`);
        } else {
          alert(`Error: ${result.error}`);
        }
        setLoading(false);
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Error marking attendance. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxWidth: '640px' }} />
      <div>
        <button onClick={startCamera}>Start Camera</button>
        <button onClick={stopCamera}>Stop Camera</button>
        <button onClick={() => markAttendance('IN')} disabled={loading}>
          Mark IN
        </button>
        <button onClick={() => markAttendance('OUT')} disabled={loading}>
          Mark OUT
        </button>
      </div>
    </div>
  );
}

export default AttendanceMarking;
```

## Testing with cURL

### Mark Attendance with Image Upload

```bash
curl -X POST http://localhost:5000/attendance/mark \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "type=IN" \
  -F "photo=@/path/to/image.jpg"
```

### Mark Attendance with Face Descriptor

```bash
curl -X POST http://localhost:5000/attendance/mark \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "type=IN" \
  -F "photo=@/path/to/image.jpg" \
  -F "faceDescriptor=[0.123,0.456,...]"
```

### Get Today's Attendance

```bash
curl -X GET http://localhost:5000/attendance/today \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Environment Variables

For Google Cloud Vision API support, add to `.env`:

```
GOOGLE_CLOUD_VISION_API_KEY=your_api_key_here
```

## Notes

1. **Face Recognition Methods:**
   - **face-api.js**: Works offline, requires frontend implementation
   - **Cloud Vision API**: Requires API key, works server-side
   - **Basic**: Just verifies image exists (no actual face recognition)

2. **Image Storage:**
   - All images are uploaded to Cloudinary
   - Images are stored in `attendance-photos` folder

3. **Face Verification:**
   - For production, store user's face descriptor during registration
   - Compare attendance face descriptor with stored descriptor
   - Threshold for matching: 0.6 (configurable)

4. **Security:**
   - All endpoints require authentication
   - Only authenticated users can mark their own attendance
   - Face verification adds an extra layer of security






