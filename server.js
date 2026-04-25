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

// const dbInit = mysql.createConnection({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD
// });
//??^^idk what this does and my code runs without it but it was in the original code so im leaving it here for now (why did copilot feel the need to finish writing my fucking comment istg)

db = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

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

function IsAdmin(req,res,next) {
    if(req.session.user && req.session.IsAdmin) return next();
    res.status(403).send("forbidden");
}


//ADMIN API
app.get("/admin", IsAdmin, (req,res) => {
    res.render("admin");
})

//admin get quizzes
app.get("/admin/quizzes", IsAdmin, (req, res) => {
    db.query("SELECT QuizID, Title FROM Quizzes", (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("DB error");
        }
        res.json(results);
    });
});

app.get("/admin/questions/:id", IsAdmin, (req,res) => {
    const quizID = req.params.id;

    const query = `
        SELECT q.QuestionID, q.Question, q.Answer
        FROM QuizQuestions qq
        JOIN Questions q ON qq.QuestionID = q.QuestionID
        WHERE qq.QuizID = ?
    `;

    db.query(query, [quizID], (err,results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
});
});

//ADMIN CREATE QUIZ
app.post("/admin/create-quiz", IsAdmin, (req, res) => {
    const { title, isDaily, region } = req.body;

    const date = isDaily
        ? new Date().toISOString().slice(0, 10)
        : null;

    const cleanRegion = region && region.trim() !== "" ? region : null;

    console.log("CREATE QUIZ:", { title, date, region: cleanRegion });
    
    db.query(
        "INSERT INTO Quizzes (Title, Date, Region) VALUES (?, ?, ?)",
        [title, date, region],
        (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send("DB error");
            }
            res.send("Quiz created");
        }
    );
});

//ADMIN ADD QUESTION
app.post("/admin/add-question", IsAdmin, (req, res) => {
    const { quizID, question, answer } = req.body;

    db.query(
        "INSERT INTO Questions (Question, Answer) VALUES (?, ?)",
        [question, answer],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Error adding question");
            }

            const qID = result.insertId;

            //get correct order
            db.query(
                "SELECT COUNT(*) AS count FROM QuizQuestions WHERE QuizID = ?",
                [quizID],
                (err, result) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send("Error counting questions");
                    }

                    const order = result[0].count + 1;

                    db.query(
                        "INSERT INTO QuizQuestions (QuizID, QuestionID, QuestionOrder) VALUES (?, ?, ?)",
                        [quizID, qID, order],
                        (err) => {
                            if (err) {
                                console.error(err);
                                return res.status(500).send("Error linking question");
                            }

                            res.send("Added");
                        }
                    );
                }
            );
        }
    );
});

// DELETE QUESTION
app.post("/admin/delete-question", IsAdmin, (req, res) => {
    const { questionID } = req.body;

    db.query("DELETE FROM Questions WHERE QuestionID = ?", [questionID],
        () => res.send("Deleted")
    );
});

//DELETE QUIZ
app.post("/admin/delete-quiz", IsAdmin, (req, res) => {
    const { quizID } = req.body;

    console.log("Deleting quiz:", quizID);

    db.query("DELETE FROM QuizQuestions WHERE QuizID = ?", [quizID], (err) => {
        if (err) {
            console.error("QuizQuestions delete error:", err);
            return res.status(500).send("Error deleting links");
        }

        db.query("DELETE FROM Quizzes WHERE QuizID = ?", [quizID], (err) => {
            if (err) {
                console.error("Quizzes delete error:", err);
                return res.status(500).send("Error deleting quiz");
            }

            res.send("Quiz deleted");
        });
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

app.get('/daily', (req, res) => {
  const query = 'SELECT Title FROM Quizzes WHERE Date = CURDATE()';
  
  db.query(query, (err, result) => {
    if (err) throw err;
    if (result.length === 0) return res.status(404).send('No daily quiz today');
    
    res.redirect(`/dailyQuiz`);
  });
});

function isLoggedIn(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/account');
}

app.get("/dailyQuiz", isLoggedIn, (req, res) => {
    const username = req.session.user;

    const attemptQuery = `
        SELECT * FROM QuizAttempts 
        WHERE username = ? 
        AND Date = CURDATE()
    `;

    const query0 = `
        SELECT QuizID, Title
        FROM Quizzes
        WHERE Date = CURDATE()
        ORDER BY QuizID DESC
        LIMIT 1;
    `;

    const query1 = `
        SELECT qb.*
        FROM QuizQuestions qq
        JOIN Questions qb 
        ON qq.QuestionID = qb.QuestionID
        WHERE qq.QuizID = ?
        ORDER BY qq.QuestionOrder;
    `;

    const query2 = "SELECT Answer FROM Questions";

    // Check attempt first
    db.query(attemptQuery, [username], (err, attemptResult) => {
        if (err) throw err;

        // If already taken, render early with the flag
        if (attemptResult.length > 0) {
            return res.render("dailyQuiz", {
                alreadyTaken: true,
                score: attemptResult[0].Score,
                quizID: null,
                title: null,
                questionsTable: [],
                allAnswers: []
            });
        }

        // Otherwise load the quiz as normal
        db.query(query0, (err, quizResult) => {
            if (err) throw err;
            if (quizResult.length === 0) return res.status(404).send("Quiz not found");

            const quiz = quizResult[0];

            db.query(query1, [quiz.QuizID], (err, results1) => {
                if (err) throw err;
                db.query(query2, (err, results2) => {
                    if (err) throw err;
                    res.render("dailyQuiz", {
                        alreadyTaken: false,
                        score: null,
                        quizID:         quiz.QuizID,
                        title:          quiz.Title,
                        questionsTable: results1,
                        allAnswers:     results2,
                    });
                });
            });
        });
    });
});

app.get("/practice", (req, res) => {
    //all non daily quizzes
    const query = "SELECT * FROM Quizzes WHERE Date IS NULL";

    db.query(query, (err, results) => {
        if (err) throw err;

        const grouped = results.reduce((acc, quiz) => {
            if (!acc[quiz.Region]) acc[quiz.Region] = [];
            acc[quiz.Region].push(quiz);
            return acc;
        }, {});
        
        res.render("practice", {
            groupedQuizzes: grouped
        });
    });
});

app.get("/account", (req, res) => {
    res.render("account");
});

app.get("/leaderboard", async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || "";
    const pageSize = 30;
    const offset = (page - 1) * pageSize;

    const query = (sql, params = []) => new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });

    try {
        await query("TRUNCATE TABLE scores");

        const rows = await query("SELECT username, score FROM quizattempts WHERE DATE(date) = CURDATE() ORDER BY score DESC");
        if (rows.length === 0) return res.render("leaderboard", { players: [], currentPage: page, totalPages: 0, search });

        const values = rows.map(row => [row.username, row.score]);
        await query("INSERT INTO scores (username, score) VALUES ?", [values]);

        let results, countResult;

        if (search) {
            results = await query(
                "SELECT username, score FROM scores WHERE username LIKE ? ORDER BY score DESC LIMIT ? OFFSET ?",
                [`%${search}%`, pageSize, offset]
            );
            countResult = await query(
                "SELECT COUNT(*) AS count FROM scores WHERE username LIKE ?",
                [`%${search}%`]
            );
        } else {
            results = await query(
                "SELECT username, score FROM scores ORDER BY score DESC LIMIT ? OFFSET ?",
                [pageSize, offset]
            );
            countResult = await query("SELECT COUNT(*) AS count FROM scores");
        }

        const totalEntries = countResult[0].count;
        const totalPages = Math.ceil(totalEntries / pageSize);

        res.render("leaderboard", {
            players: results,
            currentPage: page,
            totalPages,
            search
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

//this receives the data from the quiz.js file and adds it to the DB 
app.post("/api/save-score", isLoggedIn, (req, res) => {
    const query = "INSERT INTO QuizAttempts (Username, QuizID, Score, Date) VALUES (?, ?, ?, CURDATE())";
    const score = req.body.score;
    const quizID = req.body.quizID;
    const username = req.session.user;

    db.query(query, [username,quizID, score], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Database Error");
        }
        res.json({ message: "Score saved!" });
    });
});


//this is needed for the generateDailyQuiz Function to work we might need to redo some other code to clean it up later
const dbPromise = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}).promise();

async function generateDailyQuiz(title, numQuestions) {
  const [existing] = await dbPromise.query(
    'SELECT QuizID FROM Quizzes WHERE Date = CURDATE()'
  );
  if (existing.length > 0) return console.log('Quiz already exists for today');

  const [result] = await dbPromise.query(
    'INSERT INTO Quizzes (Title) VALUES (?)', [title]
  );
  const quizID = result.insertId;

  const [questions] = await dbPromise.query(
    'SELECT QuestionID FROM Questions ORDER BY RAND() LIMIT ?', [numQuestions]
  );

  const rows = questions.map((q, index) => [quizID, q.QuestionID, index + 1]);
  await dbPromise.query('INSERT INTO QuizQuestions (QuizID, QuestionID, QuestionOrder) VALUES ?', [rows]);

  console.log(`Daily quiz created with ID ${quizID}`);
}

generateDailyQuiz('Daily Quiz', 10);