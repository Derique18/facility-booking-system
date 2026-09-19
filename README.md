# Facility Booking System

A full-stack web application designed to streamline the reservation and scheduling of facilities. Built as a comprehensive SIWES project, this system prevents scheduling conflicts by enforcing strict operating hours, daily booking caps, and an automated background waitlist notification pipeline.

## 🚀 Core Features
* **Role-Based Access Control (RBAC):** Secure authentication segregating Admin (facility managers) and User (booking clients) permissions.
* **Automated Waitlist Queue:** An asynchronous, non-blocking background queue that automatically notifies waitlisted users via email when a slot becomes available due to a cancellation.
* **Smart Scheduling Engine:** Enforces a maximum 5-hour daily booking cap per user, validates overlapping time ranges, and aligns bookings strictly to hourly blocks.
* **Facility Management:** Admins can create facilities, set custom operating hours, and manage pending or approved reservations.

## 🛠️ Tech Stack
**Backend (API)**
* **Runtime / Framework:** Node.js, Express.js (TypeScript)
* **Database & ORM:** PostgreSQL, Prisma ORM
* **Authentication:** JSON Web Tokens (JWT)
* **Mail Service:** Nodemailer + Ethereal SMTP (Singleton pattern with connection pooling)

**Frontend (Client)**
* **Framework:** React (Vite), TypeScript
* **Styling:** Tailwind CSS
* **Routing:** React Router DOM (with Protected Routes)

---

## 📋 Prerequisites
Before you begin, ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18 or higher)
* [PostgreSQL](https://www.postgresql.org/) (Running locally or hosted)
* [Git](https://git-scm.com/)

---

## ⚙️ Environment Variable Configuration

### 1. Backend (`facility-booking-api/.env`)
Create a `.env` file in the root of your backend directory and configure the following variables:

```env
# Server Configuration
PORT=3000

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/facility_db"

# Authentication Secrets
JWT_SECRET="your_secure_jwt_secret"
JWT_REFRESH_SECRET="your_secure_refresh_secret"

# Email Configuration (Ethereal SMTP for local testing)
EMAIL_HOST="smtp.ethereal.email"
EMAIL_PORT=587
EMAIL_USER="your_ethereal_email@ethereal.email"
EMAIL_PASS="your_ethereal_password"
EMAIL_FROM="no-reply@facilityapp.com"
2. Frontend (facility-booking-ui/.env)
Create a .env file in the root of your frontend directory:

Code snippet
# API Connection
VITE_API_URL="http://localhost:3000/api"
💻 Installation & Setup Instructions
Step 1: Clone the Repository
Bash
git clone [https://github.com/Derique18/facility-booking-system.git](https://github.com/Derique18/facility-booking-system.git)
Step 2: Start the Backend Server
Open a terminal and navigate to the backend API directory:

Bash
cd facility-booking-system/facility-booking-api

# Install dependencies
npm install

# Run database migrations to create tables
npx prisma migrate dev --name init

# Start the development server
npm run dev
The backend server should now be running on http://localhost:3000.

Step 3: Start the Frontend Client
Open a new terminal window and navigate to the frontend UI directory:

Bash
cd facility-booking-system/facility-booking-ui

# Install dependencies
npm install

# Start the Vite development server
npm run dev
The React application will open in your browser, typically at http://localhost:5173.

📖 API Documentation (Swagger)
The backend API is fully documented using Swagger UI. Once the development server is running, you can access the interactive documentation to explore and test all available endpoints.

Swagger URL: http://localhost:3000/api-docs

👤 Author
Backend & Frontend Engineering: Developed as a SIWES software engineering project focusing on relational database design, asynchronous event handling, and strict type safety.


Create a new file named `README.md` in the root of your project folder (right alongside your `.gitignore`), paste this entire text block in, and save it. You can then run `git add README.md`, `git commit -m "Add comprehensive README"`, and `git push` to upload it to your GitHub!