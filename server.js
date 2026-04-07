require('dotenv').config();
const express = require("express");
const app = express();
const port = 3000;
const mysql = require("mysql2");
const path = require("path");
let db; // declare in outer scope

const bcrypt = require('bcrypt');
const session = require("express-session");

app.use(express.json());
app.use(session({
    secret: "secret-key",
    resave:false,
    saveUninitialized:false
}));

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.userPic = req.session.userPic || null;
    next();
});

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

    const usersTable = `
        CREATE TABLE IF NOT EXISTS users (
            username VARCHAR(255) UNIQUE PRIMARY KEY,
            password VARCHAR(255) NOT NULL,
            Points INT,
            IsAdmin binary,
            LastCompletedDaily Date
        )
    `;

    const quizzesTable =`
        CREATE TABLE IF NOT EXISTS quizzes (
            QuizID INT AUTO_INCREMENT PRIMARY KEY,
            Date DATE,
            TITLE VARCHAR(255)
        )
    `;

    const questionsTable=`
        CREATE TABLE IF NOT EXISTS questions (
            QuestionID INT AUTO_INCREMENT PRIMARY KEY,
            Question VARCHAR(255),
            Answer VARCHAR(255),
            Points INT NULL DEFAULT 1,
            Type VARCHAR(255)
        )
    `;


    const quizQuestionsTable=`
        CREATE TABLE IF NOT EXISTS QuizQuestions (
            QuizID INT,
            QuestionID INT,
            QuestionOrder INT,

            PRIMARY KEY (QuizID, QuestionID),

            FOREIGN KEY (QuizID) REFERENCES Quizzes(QuizID)
            ON DELETE CASCADE,

            FOREIGN KEY (QuestionID) REFERENCES Questions(QuestionID)
            ON DELETE CASCADE
            )
    `;
    //this is for testing
    const fakeTable=`
        CREATE TABLE IF NOT EXISTS fakeTable(
            ID INT AUTO_INCREMENT PRIMARY KEY,
            Value INT
            )
    `;

    db.query(scoresTable, (err) => {
        if (err) throw err;
        console.log("Scores table ensured");
    });

    db.query(usersTable, (err) =>{
        if(err) throw err;
        console.log("Users table ensured.");
    });

    db.query(questionsTable, (err) =>{
        if(err) throw err;
        console.log("Questions table ensured.");
    });

    db.query(quizzesTable, (err) =>{
        if(err) throw err;
        console.log("Quiz table ensured.");
    });

    db.query(quizQuestionsTable, (err) =>{
        if(err) throw err;
        console.log("QuizQuestions table ensured.");
    });

    db.query(fakeTable, (err) => {
        if (err) throw err;
        console.log("fake table ensured");
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/register", async(req,res) =>{
    const { username, password } =req.body;

    if(!username || !password) {
        return res.status(400).send("Missing Fields.");
    }

    try{
        const hashedPassword = await bcrypt.hash(password,10);

        db.query("INSERT INTO users (username, password) VALUES(?, ?)",
        [username, hashedPassword],
        (err) =>{
            if(err) {
                console.error(err); // log real error

            if (err.code === "ER_DUP_ENTRY") {
                return res.status(400).send("Username already exists");
            }

            return res.status(500).send("Database error");
                    }

            req.session.user = username;
            res.send("registered successfully");
        }
    );
    } catch(err){
        res.status(500).send("Server error");
    }
});

app.post("/login",(req,res) => {
    const {username, password} = req.body;

    db.query("SELECT * FROM users WHERE username = ?",
        [username],
        async(err,results)=> {
            if(err || results.length === 0){
                return res.status(400).send("No such user found.");
            }

            const user=results[0];
            const match = await bcrypt.compare(password,user.password);
            if(!match) {
                return res.status(400).send("Invalid password");
            }

            req.session.user=user.username;
            res.send("logged in");
        }
    );
});

app.post("/logout",(req,res)=>{
    req.session.destroy(()=>{
        res.redirect("/account");
    });
});


//Im not acsesing the quizzes using there id but instead there title which may be bad.
app.get("/quiz/:name", (req, res) => {
    const name = req.params.name;

    const query0 = "SELECT QuizID, Title FROM Quizzes WHERE Title = ?";

    const query1 = `
    SELECT qb.*
    FROM QuizQuestions qq
    JOIN Questions qb 
    ON qq.QuestionID = qb.QuestionID
    WHERE qq.QuizID = ?
    ORDER BY qq.QuestionOrder;
    `;

    const query2 = "SELECT Answer FROM Questions";

    db.query(query0, [name], (err, quizResult) => {
        if (err) throw err;
        if (quizResult.length === 0) return res.status(404).send("Quiz not found");

        const quiz = quizResult[0];

        db.query(query1, [quiz.QuizID], (err, results1) => {
            if (err) throw err;
            db.query(query2, (err, results2) => {
                if (err) throw err;
                res.render("quiz", {
                    id:            quiz.QuizID,
                    title:         quiz.Title,
                    questionsTable: results1,
                    allAnswers:    results2
                });
            });
        });
    });
});



app.get("/", (req, res) => {
    res.render("home");
});

app.get("/daily", (req, res) => {
    res.render("daily");
});

app.get("/practice", (req, res) => {
    const query = "SELECT * FROM Quizzes"

    db.query(query, (err, results) => {
        if (err) throw err;
        res.render("practice",{quizzesTable: results});
    });
    
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

//this receives the data from the quiz.js file and adds it to the DB 
app.post("/api/save-score", (req, res) => {
    const query = "INSERT INTO FakeTable (Value) VALUES (?)"; //This line will be modified when we do this for real
    const score = req.body.score;
    db.query(query,[score],(err,result)=>{
        if(err){
            console.error(err);
            return res.status(500).send("Database Error");
        }
        res.json({ message: "Score saved!" });
    });
});
