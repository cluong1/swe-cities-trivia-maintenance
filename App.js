const express = require('express');
const app = express();
const path = require('path');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    res.render('Home');
});

app.get('/home', (req, res) => {
    res.render('Home');
});

app.get('/account', (req, res) => {
    res.render('Account');
});

app.get('/leaderboard', (req, res) => {
    res.render('Leaderboard');
});

app.get('/practice', (req, res) => {
    res.render('Practice');
});

app.get('/daily', (req, res) => {
    res.render('Daily');
});

app.listen(2000, () => {
    console.log('Server running on http://localhost:2000');
});