require('dotenv').config();
const express = require("express");
const app = express();
const port = 3000;
const mysql = require("mysql2");
const path = require("path");
const cron = require('node-cron');
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
    res.locals.IsAdmin = req.session.IsAdmin || false;
    next();
});

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


/*  Route for registering a user.
*   Receives a request and sends it to DB.
*   Hashes password and automatically sets all new users to not be an admin.
*/
app.post("/register", async(req,res) =>{
    const { username, password } =req.body;

    if(!username || !password) {
        return res.status(400).send("Missing Fields.");
    }

    try{
        //hashing user passwords
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
            req.session.IsAdmin = false;
            
            res.send("registered successfully");
        }
    );
    } catch(err){
        res.status(500).send("Server error");
    }
});

//Helper function to ascertain user session and admin status.
function IsAdmin(req,res,next) {
    if(req.session.user && req.session.IsAdmin) return next();
    res.status(403).send("forbidden");
}

//Render admin page
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

//admin display questions for the quiz id provided
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

//ADMIN DELETE QUIZ
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

//Route to send login request to DB
//Matches provided username and password to all entries in users in DB
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
            req.session.IsAdmin = user.IsAdmin ===1;
            res.send("logged in");
        }
    );
});

//Logout route to destroy the session
app.post("/logout",(req,res)=>{
    req.session.destroy(()=>{
        res.redirect("/account");
    });
});

app.get("/", (req, res) => {
    res.render("home");
});

//i have this as a redirect in order to make it cleaner but you could redo this if you want
app.get('/daily', (req, res) => {
  const query = 'SELECT Title FROM Quizzes WHERE Date = CURDATE()';
  
  db.query(query, (err, result) => {
    if (err) throw err;
    if (result.length === 0) return res.status(404).send('No daily quiz today');
    
    res.redirect(`/dailyQuiz`);
  });
});


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
    //selects all non daily quizzes which have date as null
    const query = "SELECT * FROM Quizzes WHERE Date IS NULL";

    db.query(query, (err, results) => {
        if (err) throw err;
        //adds all quizzes to an object of region: [quiz1, quiz2]
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

app.get("/practice-group/:group", (req, res) => {
    const group = (req.params.group || "").toLowerCase();

    const map = {
        europe: ["Europe"],
        asia: ["Asia"],
        africa: ["Africa"],
        americas: ["North America"],
        oceania: ["Oceania"],
        southamerica: ["South America"]
    };

    const regions = map[group];

    if (!regions) {
        return res.status(404).send("Invalid region group");
    }

    const query = `
        SELECT * FROM Quizzes
        WHERE Date IS NULL AND Region IN (?)
    `;

    db.query(query, [regions], (err, results) => {
        if (err) throw err;

        if (results.length === 0) {
            return res.status(404).send("No quizzes found");
        }

        const quiz = results[Math.floor(Math.random() * results.length)];

        res.redirect(`/quiz/id/${quiz.QuizID}`);
    });
});


app.get("/quiz/id/:id", (req, res) => {
    const id = req.params.id;

    const query0 = "SELECT QuizID, Title, Date FROM Quizzes WHERE QuizID = ?";

    const query1 = `
        SELECT qb.*
        FROM QuizQuestions qq
        JOIN Questions qb 
        ON qq.QuestionID = qb.QuestionID
        WHERE qq.QuizID = ?
        ORDER BY qq.QuestionOrder;
    `;

    const query2 = "SELECT Answer FROM Questions";

    db.query(query0, [id], (err, quizResult) => {
        if (err) throw err;
        if (quizResult.length === 0) return res.status(404).send("Quiz not found");

        const quiz = quizResult[0];

        if (quiz.Date !== null) {
            return res.status(404).send("Quiz not found");
        }

        db.query(query1, [quiz.QuizID], (err, results1) => {
            if (err) throw err;

            db.query(query2, (err, results2) => {
                if (err) throw err;

                res.render("quiz", {
                    id: quiz.QuizID,
                    title: quiz.Title,
                    questionsTable: results1,
                    allAnswers: results2
                });
            });
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

//This receives a score and quizId from submit Answers in dailyQuiz.js and adds them to the QuizAttempts table, it get the user from the seesion.user
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

//this function will pass if they are logged in or redirect to the login page other wise
function isLoggedIn(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/account');
}

/**
 * Takes in titel and number of questions
 * Checks for existing quizzes with todays date
 * Inserts a new daily quiz into quizzes which has a date automatically and saves its ID
 * Creates a array rows contianing numQuestions random questions
 * Inserts the array into quizQuestions.
 */
function generateDailyQuiz(title, numQuestions) {
  db.query(
    'SELECT QuizID FROM Quizzes WHERE Date = CURDATE()',
    (err, existing) => {
      if (err) return console.error(err);

      if (existing.length > 0) {
        return console.log('Quiz already exists for today');
      }

      db.query(
        'INSERT INTO Quizzes (Title) VALUES (?)',
        [title],
        (err, result) => {
          if (err) return console.error(err);

          const quizID = result.insertId;

          db.query(
            'SELECT QuestionID FROM Questions ORDER BY RAND() LIMIT ?',
            [numQuestions],
            (err, questions) => {
              if (err) return console.error(err);

              const rows = questions.map((q, index) => [
                quizID,
                q.QuestionID,
                index + 1
              ]);

              db.query(
                'INSERT INTO QuizQuestions (QuizID, QuestionID, QuestionOrder) VALUES ?',
                [rows],
                (err) => {
                  if (err) return console.error(err);

                  console.log(`Daily quiz created with ID ${quizID}`);
                }
              );
            }
          );
        }
      );
    }
  );
}

//the first function call is ran on server run and the second is run on midnight. if the server were live this would make more sense.
generateDailyQuiz('Daily Quiz', 10);
//cron is just a library to run a function at a time the first number is min and sec is hour.
cron.schedule('0 0 * * *', () => {
  generateDailyQuiz('Daily Quiz', 10);
});
