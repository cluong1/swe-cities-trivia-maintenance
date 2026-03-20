require('dotenv').config();
const express = require("express");
const app = express();
const port = 3000;
const mysql = require("mysql2");
const path = require("path");





app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`);
});


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public"));

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});

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

