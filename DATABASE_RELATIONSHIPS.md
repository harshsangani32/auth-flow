# Database Relationships: Attendance ↔ User

## Overview

The **Attendance** table is properly connected to the **User** table through a **Many-to-One** relationship.

## Relationship Structure

### Database Schema

```
┌─────────────────┐         ┌──────────────────┐
│     User        │         │   Attendance     │
├─────────────────┤         ├──────────────────┤
│ id (PK)         │◄────────│ userId (FK)       │
│ firstName       │   1:N   │ id (PK)           │
│ lastName        │         │ type (IN/OUT)     │
│ email           │         │ timestamp         │
│ password        │         │ imageUrl          │
│ isVerified      │         │ faceVerified      │
│ otp             │         │ faceRecognitionData│
│ otpExpiry       │         └──────────────────┘
│ profilePhotoUrl │
└─────────────────┘
```

### Relationship Details

- **Type**: Many-to-One (Many Attendance records belong to One User)
- **Foreign Key**: `userId` in Attendance table (created automatically by TypeORM)
- **Cascade Delete**: When a User is deleted, all their Attendance records are automatically deleted (`onDelete: "CASCADE"`)

## Entity Definitions

### User Entity (`src/entities/User.ts`)

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ unique: true })
  email!: string;

  // ... other fields

  // Reverse relationship: One User can have many Attendance records
  @OneToMany(() => Attendance, (attendance) => attendance.user)
  attendance!: Attendance[];
}
```

### Attendance Entity (`src/entities/Attendance.ts`)

```typescript
@Entity()
export class Attendance {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn()
  user!: User;

  @Column({ type: "varchar", length: 10 })
  type!: "IN" | "OUT";

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  timestamp!: Date;

  // ... other fields
}
```

## How the Connection Works

### 1. Creating Attendance Record

When marking attendance, the relationship is established by passing the User entity:

```typescript
// In markAttendance service
const user = await userRepo.findOne({ where: { id: userId } });

const attendance = attendanceRepo.create({
  user,        // ← User entity is assigned here
  type: "IN",
  timestamp: new Date(),
  // ...
});

await attendanceRepo.save(attendance);
```

**What happens in the database:**
```sql
INSERT INTO attendance (userId, type, timestamp, ...)
VALUES (1, 'IN', '2024-01-15 10:30:00', ...);
```

The `userId` foreign key is automatically set to the user's ID.

### 2. Querying Attendance with User

**Option A: Using Query Builder (Current Implementation)**

```typescript
const attendance = await attendanceRepo
  .createQueryBuilder("attendance")
  .leftJoinAndSelect("attendance.user", "user")
  .where("user.id = :userId", { userId })
  .getMany();
```

**Generated SQL:**
```sql
SELECT 
  attendance.*,
  user.id, user.firstName, user.lastName, user.email, ...
FROM attendance
LEFT JOIN user ON attendance.userId = user.id
WHERE user.id = 1
ORDER BY attendance.timestamp DESC;
```

**Option B: Using Relations (Alternative)**

```typescript
const attendance = await attendanceRepo.find({
  where: { user: { id: userId } },
  relations: ["user"]
});
```

### 3. Querying User with Attendance

**Get user with all attendance records:**

```typescript
const user = await userRepo.findOne({
  where: { id: userId },
  relations: ["attendance"]
});

// Access attendance records
console.log(user.attendance); // Array of Attendance entities
```

**Generated SQL:**
```sql
SELECT 
  user.*,
  attendance.id, attendance.type, attendance.timestamp, ...
FROM user
LEFT JOIN attendance ON attendance.userId = user.id
WHERE user.id = 1;
```

## Database Table Structure

### User Table
```sql
CREATE TABLE user (
  id SERIAL PRIMARY KEY,
  firstName VARCHAR NOT NULL,
  lastName VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  isVerified BOOLEAN DEFAULT false,
  otp VARCHAR,
  otpExpiry TIMESTAMP,
  profilePhotoUrl VARCHAR
);
```

### Attendance Table
```sql
CREATE TABLE attendance (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL,  -- Foreign Key
  type VARCHAR(10) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  imageUrl VARCHAR,
  faceVerified BOOLEAN DEFAULT false,
  faceRecognitionData TEXT,
  
  CONSTRAINT fk_user 
    FOREIGN KEY (userId) 
    REFERENCES user(id) 
    ON DELETE CASCADE
);
```

## Relationship Examples

### Example 1: Get All Attendance for a User

```typescript
// Service function
export const getUserAttendance = async (userId: number) => {
  const queryBuilder = attendanceRepo
    .createQueryBuilder("attendance")
    .leftJoinAndSelect("attendance.user", "user")
    .where("user.id = :userId", { userId })
    .orderBy("attendance.timestamp", "DESC");

  return await queryBuilder.getMany();
};
```

**Result:**
```json
[
  {
    "id": 1,
    "type": "IN",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "imageUrl": "https://...",
    "faceVerified": true,
    "user": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    }
  },
  {
    "id": 2,
    "type": "OUT",
    "timestamp": "2024-01-15T18:00:00.000Z",
    "user": { ... }
  }
]
```

### Example 2: Get User with All Attendance

```typescript
const user = await userRepo.findOne({
  where: { id: userId },
  relations: ["attendance"]
});

console.log(user.attendance.length); // Number of attendance records
```

### Example 3: Cascade Delete

When a user is deleted:
```typescript
await userRepo.remove(user);
```

**What happens:**
- User record is deleted
- All attendance records with `userId = user.id` are automatically deleted
- This is handled by `ON DELETE CASCADE` constraint

## Verification Queries

### Check Relationship in Database

```sql
-- Get all attendance with user details
SELECT 
  a.id,
  a.type,
  a.timestamp,
  u.firstName,
  u.lastName,
  u.email
FROM attendance a
JOIN user u ON a.userId = u.id
ORDER BY a.timestamp DESC;

-- Count attendance per user
SELECT 
  u.id,
  u.firstName,
  u.lastName,
  COUNT(a.id) as attendance_count
FROM user u
LEFT JOIN attendance a ON a.userId = u.id
GROUP BY u.id, u.firstName, u.lastName;

-- Get user's attendance for today
SELECT *
FROM attendance
WHERE userId = 1
  AND DATE(timestamp) = CURRENT_DATE
ORDER BY timestamp DESC;
```

## API Endpoints Using the Relationship

### 1. Mark Attendance
```
POST /attendance/mark
```
- Uses `req.user.userId` to get authenticated user
- Creates attendance record linked to that user
- Relationship: `attendance.user = user`

### 2. Get User Attendance
```
GET /attendance
```
- Uses `req.user.userId` to filter attendance
- Returns only attendance records for that user
- Relationship: Filters by `attendance.userId = user.id`

### 3. Get Today's Attendance
```
GET /attendance/today
```
- Uses `req.user.userId` to filter attendance
- Returns today's attendance for that user
- Relationship: Filters by `attendance.userId = user.id` AND date filter

## Benefits of This Relationship

1. **Data Integrity**: Foreign key constraint ensures attendance always belongs to a valid user
2. **Cascade Delete**: Automatically cleans up attendance when user is deleted
3. **Easy Queries**: Can easily get all attendance for a user or user details with attendance
4. **Type Safety**: TypeORM provides type-safe queries and relationships
5. **Performance**: Database indexes on foreign keys improve query performance

## Summary

✅ **Attendance table is properly connected to User table**
- Foreign key relationship: `attendance.userId → user.id`
- Many-to-One relationship: Many attendance records can belong to one user
- Cascade delete: Attendance records are deleted when user is deleted
- Bidirectional relationship: Can query from both sides (User → Attendance, Attendance → User)

The relationship is fully functional and being used correctly in all service functions! 🎯






