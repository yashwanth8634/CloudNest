const express = require('express');
const router = express.Router();
const { body,validationResult } = require('express-validator');
const UserModal = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Middleware to prevent authenticated users from accessing login/register pages
const redirectIfAuthenticated = (req, res, next) => {
    const token = req.cookies.token;

    // Add headers to prevent the browser from caching these pages
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            // If the token is valid, the user is already logged in. Redirect them.
            return res.redirect('/home');
        } catch (err) {
            // If token is invalid (e.g., expired), clear the cookie and let them proceed.
            res.clearCookie('token');
        }
    }
    next();
};

router.get('/register', redirectIfAuthenticated, (req,res)=>{
    res.render("register", { error: req.flash('error') });
});

router.post('/register',
    body('email').trim().isEmail(),
    body('password').trim().isLength({min:5}),
    body('username').trim().isLength({min:3}),
    async (req,res)=>{

    if(!validationResult(req).isEmpty()){ 
        req.flash('error', 'Invalid data. Username and password must be longer.');
        return res.redirect('/user/register');
    }


    const {username,email,password} = req.body;

     const existingUser = await UserModal.findOne({ email });
    if (existingUser) {
      req.flash('error', 'An account with this email already exists.');
      return res.redirect('/user/register');
    }



    const hashedPassword = await bcrypt.hash(password,10);
    const newuser = await UserModal.create({username,email,password:hashedPassword});

    res.redirect('/user/login');
});

router.get('/login', redirectIfAuthenticated, (req,res)=>{
    res.render("login", { error: req.flash('error') });
});

router.post('/login',
    body('username').trim().isLength({min:3}),
    body('password').trim().isLength({min:5}),
    async (req,res)=>{

        const errors = validationResult(req);
    if(!errors.isEmpty()){
        req.flash('error', 'Please enter a valid username and password.');
        return res.redirect('/user/login');
    }

    const {username,password} = req.body;

    const user = await UserModal.findOne({
        username:username,
    })
    if(!user){
        req.flash('error', 'Invalid username or password.');
        return res.redirect('/user/login');
    }

    const isMatch = await bcrypt.compare(password,user.password);
    if(!isMatch){
        req.flash('error', 'Invalid username or password.');
        return res.redirect('/user/login');
    }

    const token = jwt.sign({
        userId:user._id,
        username:user.username,
        email:user.email
    },process.env.JWT_SECRET,)

    res.cookie('token',token)

    return res.redirect('/home');


}
    
    
);

router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

module.exports=router;