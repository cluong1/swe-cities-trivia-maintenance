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

app.get("/recipe/:id", (req, res) => {
    const recipeId = req.params.id;

    db.query("SELECT * FROM Recipes WHERE recipe_id = ?", [recipeId], (err, recipeResult) => {
        if (err) throw err;

        db.query("SELECT * FROM Ingredients WHERE recipe_id = ?", [recipeId], (err, ingredientResult) => {
            if (err) throw err;

            db.query("SELECT * FROM Steps WHERE recipe_id = ? ORDER BY step_number", [recipeId], (err, stepResult) => {
                if (err) throw err;

                res.render("recipe", {
                    recipe: recipeResult[0],
                    ingredients: ingredientResult,
                    steps: stepResult
                });
            });
        });
    });
});

app.get("/recipes", (req, res) => {
    const categories = ["Chicken", "Beef", "Tofu", "Grains"];
    let recipesByCategory = {};

    let count = 0;
    categories.forEach(category => {
        db.query("SELECT * FROM Recipes WHERE main_protein = ?", [category], (err, results) => {
            if(err) throw err;
            recipesByCategory[category] = results;
            count++;
            if(count === categories.length){
                res.render("recipes", { recipesByCategory });
            }
        });
    });
});

app.get("/add_recipes", (req, res) => {
    db.query("SELECT DISTINCT ingredient_name FROM Ingredients", (err, ingredients) => {
        if(err) throw err;
        res.render("add_recipes", { ingredients });
    });
});

app.post("/add_recipes", express.urlencoded({ extended: true }), (req, res) => {
    const { name, description, prep_time_minutes, main_protein, ingredients, steps } = req.body;

    // Insert recipe
    db.query(
        "INSERT INTO Recipes (name, description, prep_time_minutes, main_protein) VALUES (?, ?, ?, ?)",
        [name, description, prep_time_minutes, main_protein],
        (err, result) => {
            if (err) throw err;

            const recipeId = result.insertId;

            // Split ingredients and insert into Ingredients table
            const ingredientList = ingredients.split(',').map(i => i.trim()).filter(i => i);
            ingredientList.forEach(item => {
                // Optional: separate quantity and name if you want to store them separately
                db.query(
                    "INSERT INTO Ingredients (recipe_id, ingredient_name) VALUES (?, ?)",
                    [recipeId, item],
                    err => { if (err) throw err; }
                );
            });

            // Split steps and insert into Steps table
            const stepList = steps.split(',').map(s => s.trim()).filter(s => s);
            stepList.forEach((instruction, index) => {
                db.query(
                    "INSERT INTO Steps (recipe_id, step_number, instruction) VALUES (?, ?, ?)",
                    [recipeId, index + 1, instruction],
                    err => { if (err) throw err; }
                );
            });

            res.redirect("/recipes");
        }
    );
});