const express = require('express');
const app = express();
const userRouter = require('./routes/user.routes')
const dotenv = require('dotenv');
dotenv.config();
const connectToDB = require('./config/db');
connectToDB();
const cookieParser = require('cookie-parser');
const indexRouter = require('./routes/index.routes');
const session = require('express-session');
const flash = require('connect-flash');
const jwt = require('jsonwebtoken');
const path = require('path');


app.set('view engine','ejs');
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET || 'a-very-secret-key',
    resave: false,
    saveUninitialized: false,
}));

app.use(flash());


 
app.get('/',(req,res)=>{
    const token = req.cookies.token;

    // Add headers to prevent the browser from caching the landing page
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            // If token is valid, user is logged in, redirect to home
            return res.redirect('/home');
        } catch (err) {
            // If token is invalid (e.g., expired), clear it and show landing page
            res.clearCookie('token');
        }
    }
    res.render("landing");
})
app.use('/',indexRouter);
app.use('/user',userRouter);

// Centralized error handler
app.use((err, req, res, next) => {
    console.error("--- An unhandled error occurred ---");
    console.error("Error:", err.message);
    console.error("Stack:", err.stack);
    // In a real production app, you might want to render a user-friendly error page
    // For now, we'll send a generic JSON error
    if (res.headersSent) {
        return next(err);
    }
    res.status(500).json({ error: 'An internal server error occurred.' });
});

process.on('uncaughtException',(err)=>{ 
    console.error('--- UNCAUGHT EXCEPTION ---', err);})


const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // First, connect to the database
    await connectToDB();

    // Then, start the Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
};

startServer();