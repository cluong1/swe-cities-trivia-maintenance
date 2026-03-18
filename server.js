require('dotenv').config();
const express = require("express");
const app = express();
const port = 3000;
const mysql = require("mysql2");
const path = require("path");

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.connect(err => {
    if(err) {
        console.error("Database connection failed:", err);
    } else {
        console.log("Connected to MySQL!");
    }
});

app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`);
});


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public"));

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});

app.get("/", (req, res) => {
    res.render("home", { 
        favoriteFood: "Spaghetti",
        experience: "I love cooking spaghetti because it reminds me of family dinners. The smell of roasting tomatos for the sauce and garlic fills the house, it reminds me of a more comforting time!"
    });
});

app.get("/top5", (req, res) => {
    db.query("SELECT username, score FROM scores ORDER BY score DESC LIMIT 50 OFFSET 0", (err, results) => {
        res.render("leaderboard", { 
            players: results
        });
    });
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

