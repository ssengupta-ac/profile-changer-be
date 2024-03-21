const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3001;
const users = {}; // This will store users as {email: {userData}}

app.use(cors({
    origin: 'http://localhost:3000' // Allow only this origin to access
}));
app.use(bodyParser.json());

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Sign Up
app.post('/signup', async (req, res) => {
    console.log(req.body);
    const { email, password, firstName, lastName, address } = req.body;
    if (!email || !password || !firstName || !lastName || !address) {
        return res.status(400).send('All fields are required');
    }
    // Simple email validation
    if (!/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).send('Invalid email address');
    }
    // Password length validation
    if (password.length < 8) {
        return res.status(400).send('Password must be at least 8 characters long');
    }
    if (users[email]) {
        return res.status(400).send('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    users[email] = { email, password: hashedPassword, firstName, lastName, address };
    res.send('You have been signed up!');
});

// Login
app.post('/login', async (req, res) => {
    console.log(req.body);
    const { email, password } = req.body;
    const user = users[email];
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).send('Your email or password is incorrect!');
    }
    // In a real application, you should send back a token here
    // For simplicity, we're just sending a success message
    res.send('Login successful');
});

// Middleware to validate email from query and ensure user exists
const validateUser = (req, res, next) => {
    console.log(req.query);
    const { email } = req.query;
    if (!email || !users[email]) {
        return res.status(404).send('User not found');
    }
    req.user = users[email]; // Attach user to request object
    next();
};

// Fetch profile
app.get('/profile', validateUser, (req, res) => {
    console.log(req.user);
    const { password, ...userWithoutPassword } = req.user; // Exclude password from the response
    res.json(userWithoutPassword);
});

// POST /profile endpoint to update user profile data
app.post('/profile', async (req, res) => {
    console.log(req);
    const { email } = req.body.email;
    const { birthday, favoriteColor, favoriteQuote } = req.body;

    // Update user details in the in-memory database
    users[email] = {
        ...users[email],
        birthday,
        favoriteColor,
        favoriteQuote
    };

    res.send('Profile updated successfully');
});

