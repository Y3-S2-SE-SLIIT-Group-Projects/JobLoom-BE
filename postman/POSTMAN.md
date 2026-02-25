# JobLoom API - Postman Collection

## 📦 Import Instructions

### Method 1: Import File

1. Open Postman
2. Click **Import** button (top left)
3. Select **Upload Files**
4. Choose `JobLoom-API.postman_collection.json`
5. Click **Import**

### Method 2: Import via Link

1. Open Postman
2. Click **Import** → **Link**
3. Paste the raw GitHub URL of this file
4. Click **Continue** → **Import**

---

## 🌐 Environment Setup

### Create Environment

1. Click **Environments** (left sidebar)
2. Click **Create Environment**
3. Name it: `JobLoom Local`
4. Add variables:

| Variable   | Initial Value               | Current Value                         |
| ---------- | --------------------------- | ------------------------------------- |
| `baseUrl`  | `http://localhost:3000/api` | `http://localhost:3000/api`           |
| `token`    | _(leave empty)_             | _(auto-filled after login)_           |
| `userId`   | _(leave empty)_             | _(auto-filled after login)_           |
| `reviewId` | _(leave empty)_             | _(auto-filled after creating review)_ |

5. Click **Save**

### Set Active Environment

- Select **JobLoom Local** from the environment dropdown (top right)

---

## 🚀 Quick Start Guide

### 1. Health Check

**Test if server is running:**

```
GET http://localhost:3000/health
```

Should return `200 OK` with system info.

### 2. Register User

**Create a new account:**

```
POST {{baseUrl}}/users/register

Body:
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "role": "job_seeker",
  "phone": "+94771234567"
}
```

**Result:** Token is automatically saved to `{{token}}` variable!

### 3. Get Your Profile

```
GET {{baseUrl}}/users/me
Authorization: Bearer {{token}}
```

Token is already set from previous step! ✅

---

## 📋 Collection Structure

### 🏥 Health & Status

- **API Root** - Get API info
- **Health Check** - Full system health
- **Liveness Probe** - K8s liveness
- **Readiness Probe** - K8s readiness

### 👤 Authentication & Users

- **Register User** - Create account (auto-saves token)
- **Login** - Authenticate (auto-saves token)
- **Get User by ID** - Public profile
- **Get My Profile** - Own profile (requires auth)
- **Update Profile** - Update own profile (requires auth)

### ⭐ Reviews & Ratings

- **Create Review** - Post review (requires auth + accepted application)
- **Get Review by ID** - Single review
- **Get User Reviews** - All reviews for user (with filters)
- **Get Job Reviews** - Reviews for specific job
- **Get User Rating Statistics** - Stats, badge, trust score
- **Get Employer Reviews** - Employer-specific reviews
- **Get Job Seeker Reviews** - Job seeker reviews
- **Update Review** - Edit own review (within 7 days)
- **Delete Review** - Soft delete own review
- **Report Review** - Flag for moderation

### 💼 Jobs

- **Get Job by ID** - Single job
- **Get All Jobs** - List jobs (with filters)

### 📝 Applications

- **Check Application Status** - Has user applied?
- **Get Application by ID** - Application details

---

## 🔐 Authentication

### How It Works

1. **Register** or **Login** to get JWT token
2. Token is **automatically saved** to `{{token}}` variable
3. Protected endpoints use: `Authorization: Bearer {{token}}`
4. Token is **auto-included** in requests (collection-level auth)

### Manual Token Setup

If auto-save fails:

1. Copy token from register/login response
2. Go to **Environments** → **JobLoom Local**
3. Paste in `token` variable
4. Save

### Token Expiry

- Tokens expire after **7 days**
- Re-login to get new token

---

## 🎯 Review System Features

### Trust Score Algorithm

Trust score (0-100) based on:

- **Rating Average**: Higher = better (50% weight)
- **Review Count**: More reviews = more trust (30% weight)
- **Completeness**: Detailed reviews = higher trust (20% weight)

Formula:

```
trustScore = (avgRating * 10) + min(reviewCount, 10) + completeness
```

### Badge System

| Badge              | Requirements             | Description             |
| ------------------ | ------------------------ | ----------------------- |
| 🏆 **Elite**       | 4.8+ rating, 20+ reviews | Top 1% performers       |
| ⭐ **Top Rated**   | 4.5+ rating, 10+ reviews | Consistently excellent  |
| ✅ **Trusted**     | 4.0+ rating, 5+ reviews  | Reliable and dependable |
| 🌟 **Rising Star** | 4.2+ rating, 2-4 reviews | Promising new members   |

### Rating Criteria

For **Employers** (rated by job seekers):

- Work Quality
- Communication
- Punctuality
- **Payment On Time** ✅

For **Job Seekers** (rated by employers):

- Work Quality
- Communication
- Punctuality

---

## 📊 Query Parameters

### Pagination (User Reviews, Job Reviews)

```
?page=1&limit=10
```

### Filtering (User Reviews)

```
?reviewerType=job_seeker
?reviewerType=employer
```

### Sorting

```
?sort=-createdAt    # Newest first
?sort=rating        # Lowest rating first
?sort=-rating       # Highest rating first
```

---

## 🧪 Testing Scenarios

### Scenario 1: Complete Review Flow

1. Register two users (employer + job seeker)
2. Employer creates job
3. Job seeker applies
4. Employer accepts application
5. Job seeker creates review for employer
6. Employer creates review for job seeker
7. Check rating statistics for both users

### Scenario 2: Trust Score Evolution

1. Create user
2. Get initial stats (0 reviews, no badge)
3. Add 2 reviews (4.2+ rating) → **Rising Star** 🌟
4. Add 5 reviews (4.0+ rating) → **Trusted** ✅
5. Add 10 reviews (4.5+ rating) → **Top Rated** ⭐
6. Add 20 reviews (4.8+ rating) → **Elite** 🏆

### Scenario 3: Review Restrictions

1. Try to review yourself → **400 Error**
2. Try to review without accepted application → **403 Error**
3. Try to review same person twice for same job → **409 Error**
4. Try to update someone else's review → **403 Error**
5. Try to update review after 7 days → **400 Error**

### Scenario 4: Moderation

1. Create review
2. Report review with reason
3. Try to report same review again → **409 Error**

---

## 🐛 Common Errors

### 401 Unauthorized

**Problem:** Missing or invalid token  
**Solution:** Login again, check token in environment

### 403 Forbidden

**Problem:** Don't have permission (e.g., review without accepted application)  
**Solution:** Ensure you've worked together (accepted application exists)

### 404 Not Found

**Problem:** Resource doesn't exist  
**Solution:** Check ID is correct, resource may be deleted

### 409 Conflict

**Problem:** Duplicate resource (e.g., already reviewed)  
**Solution:** Update existing review instead of creating new one

### 422 Validation Error

**Problem:** Invalid data format  
**Solution:** Check request body matches validation rules

---

## 📚 Additional Resources

- **API Documentation**: See `/docs` folder
- **OpenAPI Spec**: Coming soon
- **Swagger UI**: Coming soon
- **GitHub**: [JobLoom-BE Repository](https://github.com/Y3-S2-SE-SLIIT-Group-Projects/JobLoom-BE)

---

## 💡 Tips & Tricks

### Auto-Save Variables

Register and Login requests automatically save:

- `token` - JWT for authentication
- `userId` - Your user ID

### Pre-request Scripts

Collection includes scripts to:

- Auto-add Bearer token to headers
- Set common headers (Content-Type)

### Test Scripts

Some requests have post-response tests:

- Save tokens to environment
- Validate response structure
- Check status codes

### Collection Variables vs Environment

- **Collection Variables**: Default values (baseUrl)
- **Environment Variables**: Instance-specific (token, userId)
- **Recommendation**: Use environments for different deployments (local, staging, prod)

---

## 🔄 Version History

### v1.0.0 (Current)

- ✅ Complete API coverage
- ✅ Authentication & user management
- ✅ Review & rating system
- ✅ Health checks
- ✅ Auto-token management
- ✅ Comprehensive documentation

---

## 📞 Support

**Issues or Questions?**

- Create issue on GitHub
- Check `/docs/TESTING.md` for testing guide
- Review code comments in source files

---

**Happy Testing! 🚀**
