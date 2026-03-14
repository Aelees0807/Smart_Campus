# Smart Campus Backend API

Backend server for the Smart Campus application, built with Node.js, Express, and Supabase.

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- Supabase account and project

### Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=5000
```

3. **Set up database:**
   - Go to your Supabase SQL Editor
   - Run the SQL from `database/schema.sql`

4. **Start the server:**

```bash
npm start
```

Server will run on `http://localhost:5000`

## 📚 API Endpoints

### Authentication

- `POST /api/login` - User login

### Users (Admin)

- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Assignments

- `GET /api/assignments` - Get all assignments
- `POST /api/assignments` - Create assignment
- `DELETE /api/assignments/:id` - Delete assignment

### Leaves

- `GET /api/leaves/:studentId` - Get student's leaves
- `POST /api/leaves` - Apply for leave
- `PUT /api/leaves/:id` - Update leave
- `DELETE /api/leaves/:id` - Delete leave

### Complaints

- `GET /api/complaints/:studentId` - Get student's complaints
- `POST /api/complaints` - Submit complaint
- `PUT /api/complaints/:id` - Update complaint
- `DELETE /api/complaints/:id` - Delete complaint

## 🔧 Tech Stack

- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL)
- **Authentication:** bcryptjs
- **CORS:** Enabled for frontend integration

## 📁 Project Structure

```
backend/
├── config/
│   └── supabase.js       # Supabase connection
├── database/
│   └── schema.sql        # Database schema
├── routes/
│   ├── auth.js          # Authentication routes
│   ├── users.js         # User management
│   ├── assignments.js   # Assignment routes
│   ├── leaves.js        # Leave management
│   └── complaints.js    # Complaint routes
├── server.js            # Main server file
├── package.json
├── .env.example
└── .gitignore
```

## 🔒 Default Credentials

**Admin:**

- User ID: `ADM001`
- Password: `admin123`

⚠️ **Change these credentials after first login!**

## 🌐 Deployment

This backend is ready to deploy to:

- Render
- Railway
- Vercel
- Any Node.js hosting service

Make sure to set environment variables in your deployment platform.

## 📖 Full Setup Guide

For detailed setup instructions, see the [Supabase Setup Guide](../supabase-setup-guide.md).

## 🐛 Troubleshooting

**Server won't start:**

- Check if `.env` file exists with correct credentials
- Verify Supabase project URL and API key

**Database errors:**

- Ensure `schema.sql` was run in Supabase
- Check Row Level Security policies

**CORS errors:**

- CORS is enabled by default for all origins
- For production, configure specific allowed origins

## 📝 License

MIT
