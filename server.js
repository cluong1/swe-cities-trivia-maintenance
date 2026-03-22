require('dotenv').config();
const express = require("express");
const app = express();
const port = 3000;
const mysql = require("mysql2");
const path = require("path");
let db; // declare in outer scope

const dbInit = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

dbInit.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`, (err) => {
    if (err) throw err;

    db = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    initializeTables(db);
    populateLeaderboard(db);
    // START SERVER ONLY AFTER DB IS READY
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
});

function initializeTables(db) {
    const scoresTable = `
        CREATE TABLE IF NOT EXISTS scores (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255),
            score INT
        )
    `;

    db.query(scoresTable, (err) => {
        if (err) throw err;
        console.log("Scores table ensured");
    });
}

function populateLeaderboard(db) {
    db.query("TRUNCATE TABLE scores", (err) => {
        if (err) throw err;

        const totalPlayers = 60;
        const values = [];

        for (let i = 1; i <= totalPlayers; i++) {
            const username = `Player${i}`;
            const score = Math.floor(Math.random() * 1000);
            values.push([username, score]);
        }

        db.query("INSERT INTO scores (username, score) VALUES ?", [values], (err, result) => {
            if (err) throw err;
            console.log("Leaderboard reset and populated");
        });
    });
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public"));

app.get("/quiz", (req, res) => {
    res.render("quiz", { 
    });
});
app.get("/", (req, res) => {
    res.render("home");
});

app.get("/daily", (req, res) => {
    res.render("daily");
});

app.get("/practice", (req, res) => {
    res.render("practice");
});

app.get("/account", (req, res) => {
    res.render("account");
});

app.get("/leaderboard", (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 30; 
    const offset = (page - 1) * pageSize;

    db.query("SELECT username, score FROM scores ORDER BY score DESC LIMIT ? OFFSET ?", [pageSize, offset], (err, results) => {
        db.query("SELECT COUNT(*) AS count FROM scores", (err2, countResult) => {

            const totalEntries = countResult[0].count;
            const totalPages = Math.ceil(totalEntries / pageSize);

            res.render("leaderboard", { 
                players: results,
                currentPage: page,
                totalPages
            });
        });
    });
});

