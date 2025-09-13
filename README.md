# 📁 CloudNest - Secure File Storage

CloudNest is a full-stack web application that provides a personal cloud storage solution, allowing users to securely upload, store, and manage their files. It is built with Node.js, Express, and MongoDB, with EJS for server-side rendering.

## ✨ Features

- **Secure User Authentication**: Safe registration and login with JWT (JSON Web Tokens).
- **Password Encryption**: User passwords are securely hashed using `bcrypt`.
- **File Uploads**: Smooth file uploads handled by `multer`.
- **Cloud Storage**: Integrated with Supabase for robust and scalable file storage.
- **Dynamic UI**: Server-side rendered views with EJS for a fast user experience.
- **Session Management**: Flash messages for user feedback using `connect-flash`.
- **Protected Routes**: Ensures that only authenticated users can access their personal dashboard and files.

---

## 🛠️ Tech Stack

| Category          | Technology                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| **Backend**       | Node.js, Express.js                                    |
| **Database**      | MongoDB with Mongoose                             |
| **Authentication**| JSON Web Tokens, bcrypt                      |
| **File Storage**  | Supabase Storage                                                       |
| **Templating**    | EJS (Embedded JavaScript templates)                                                 |
| **Development**   | Nodemon, dotenv                          |

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Make sure you have the following installed on your system:
- Node.js (v18.x or higher recommended)
- npm
- MongoDB
- A Supabase account for file storage.

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-username/drive.git
   ```

2. **Navigate to the project directory:**
   ```sh
   cd drive
   ```

3. **Install NPM packages:**
   ```sh
   npm install
   ```

### Configuration

1. Create a `.env` file in the root of the project.

2. Add the following environment variables to your `.env` file.
   ```env
   # Server Configuration
   PORT=3000

   # MongoDB Connection
   MONGO_URI=your_mongodb_connection_string

   # JWT and Session Secrets
   JWT_SECRET=a-very-strong-jwt-secret
   SESSION_SECRET=a-very-strong-session-secret

   # Supabase Credentials
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   ```
   - **`MONGO_URI`**: Your connection string for your MongoDB database.
   - **`JWT_SECRET` / `SESSION_SECRET`**: Long, random, and secret strings for security.
   - **`SUPABASE_URL` / `SUPABASE_KEY`**: Find these in your Supabase project's API settings.

---

## 🏃‍♂️ Usage

To run the application in a development environment with auto-reloading, use:

```sh
npm start
```

The server will start on `http://localhost:3000` (or the port you specified in your `.env` file).

---

## 📂 Project Structure

```
drive/
├── config/
│   └── db.js           # Database connection logic
├── public/             # Static assets (CSS, images, client-side JS)
├── routes/             # Express route definitions
├── views/              # EJS template files
├── .env.example        # Example environment variables
├── app.js              # Main Express application file
├── package.json
└── README.md
```

---

