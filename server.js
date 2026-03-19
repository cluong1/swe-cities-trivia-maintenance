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
