const express = require('express');
const app = express();
const { pool } = require("./dbConfig"); // Ensure dbConfig exports an object with Pool

const bcrypt = require('bcrypt');

const session = require('express-session');
const flash = require('express-flash');
const { name } = require('ejs');

const PORT = process.env.PORT || 4000;

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: false }));


app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true
}));

app.use(flash());

app.get('/', (req, res) => {
    res.render("index");
});

app.get('/users/register', (req, res) => {
    res.render("register");
});

app.get('/users/login', (req, res) => {
    res.render("login");
});

app.get('/users/dashboard', (req, res) => {
    if (req.session.user) {
        res.render("dashboard", { user: req.session.user.name });
    } else {
        req.flash('error_msg', 'Please log in to view this resource');
        res.redirect('/users/login');
    }
});


app.post('/users/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        pool.query(`SELECT * FROM users WHERE email = $1`, [email], async (err, result) => {
            if (err) {
                throw err;
            }

            if (result.rows.length > 0) {
                const user = result.rows[0];
                const isMatch = await bcrypt.compare(password, user.password);

                if (isMatch) {
                    req.session.user = user; // Store user in session
                    req.flash('success_msg', 'You are now logged in');
                    res.redirect('/users/dashboard');
                } else {
                    req.flash('error_msg', 'Password incorrect');
                    res.redirect('/users/login');
                }
            } else {
                req.flash('error_msg', 'No user with that email address');
                res.redirect('/users/login');
            }
        });
    } catch (err) {
        console.error(err);
        res.redirect('/users/login');
    }
});


app.post('/users/login', async (req, res) => {
    const { email, password } = req.body;
    console.log({ email, password });

    try {
        pool.query(
            `SELECT * FROM users WHERE email = $1`, [email], async (err, result) => {
                if (err) {
                    throw err;
                }

                if (result.rows.length > 0) {
                    const user = result.rows[0];

                    // Compare the password with the hashed password stored in the database
                    const isMatch = await bcrypt.compare(password, user.password);

                    if (isMatch) {
                        // If passwords match, render the dashboard
                        req.flash('success_msg', 'You are now logged in'); // Changed to req.flash
                        res.redirect('/users/dashboard');
                    } else {
                        // If passwords don't match, send error message
                        req.flash('error_msg', 'Password incorrect'); // Changed to req.flash
                        res.redirect('/users/login');
                    }
                } else {
                    // If user not found, send error message
                    req.flash('error_msg', 'No user with that email address'); // Changed to req.flash
                    res.redirect('/users/login');
                }
            }
        );
    } catch (err) {
        console.error(err);
        res.redirect('/users/login');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
