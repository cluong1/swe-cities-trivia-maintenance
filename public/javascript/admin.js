// -------------------------
// ELEMENTS
// -------------------------
const quizList = document.getElementById("quizList");
const questionList = document.getElementById("questionList");
const selectedTitle = document.getElementById("selectedTitle");
const createQuizForm = document.getElementById("createQuizForm");
const addQuestionForm = document.getElementById("addQuestionForm");
const quizTitle = document.getElementById("quizTitle");
const isDaily = document.getElementById("isDaily");
const questionText = document.getElementById("questionText");
const answerText = document.getElementById("answerText");
const region = document.getElementById("region");
const btn = document.createElement("button");


let selectedQuiz = null;
let selectedQuizTitle = null;

// -------------------------
// LOAD QUIZZES
// -------------------------
async function loadQuizzes() {
    const res = await fetch("/admin/quizzes", { credentials: "include" });

    //Send error if invalid response
    if (!res.ok) {
        const text = await res.text();
        console.error("Error response:", text);
        return;
    }

    const data = await res.json();

    quizList.innerHTML = "";

    data.forEach(q => {
        const li = document.createElement("li");

        // text
        const text = document.createElement("span");
        text.textContent = `${q.Title} ${q.Region ? `(${q.Region})` : ""}`;

        // delete button
        const btn = document.createElement("button");
        btn.textContent = "Delete";

        btn.addEventListener("click", (e) => {
            e.stopPropagation(); // prevents selecting quiz
            deleteQuiz(q.QuizID);
        });

        // clicking li selects quiz
        li.addEventListener("click", () => {
            loadQuestions(q.QuizID, q.Title);
            selectedQuiz = q.QuizID;
            selectedQuizTitle = q.Title;
        });

        if (selectedQuiz === q.QuizID) {
            li.classList.add("selected");
        }

        li.appendChild(text);
        li.appendChild(btn);
        quizList.appendChild(li);
    });
}

// -------------------------
// DELETE QUIZ
// -------------------------
async function deleteQuiz(id) {
    //handle errors
    if (!confirm("Delete this quiz?")) return;

    //async send delete request to server.js
    await fetch("/admin/delete-quiz", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        credentials: "include",
        body: JSON.stringify({ quizID: id })
    });

    //delete item from list element
    if (selectedQuiz === id) {
        selectedQuiz = null;
        selectedQuizTitle = null;
        questionList.innerHTML = "";
        selectedTitle.innerText = "";
    }

    //reload quizzes
    loadQuizzes();
}

// -------------------------
// LOAD QUESTIONS
// -------------------------
async function loadQuestions(id, title) {
    //select quiz to display questions
    selectedQuiz = Number(id);
    selectedQuizTitle = title;

    selectedTitle.innerText = title;

    //grab response
    const res = await fetch(`/admin/questions/${id}`, {
        credentials: "include"
    });

    const data = await res.json();

    questionList.innerHTML = "";

    //create delete button next to each question
    data.forEach(q => {
        const li = document.createElement("li");

        const text = document.createElement("span");
        text.textContent = `${q.Question} (Answer: ${q.Answer})`;

        const btn = document.createElement("button");
        btn.textContent = "Delete";

        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            deleteQuestion(q.QuestionID);
        });

        li.appendChild(text);
        li.appendChild(btn);

        questionList.appendChild(li);
    });
}

// -------------------------
// CREATE QUIZ
// -------------------------
createQuizForm.onsubmit = async e => {
    e.preventDefault();

    //send post request to server.js
    await fetch("/admin/create-quiz", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        credentials: "include",
        body: JSON.stringify({
            title: quizTitle.value,
            isDaily: isDaily.checked,
            region: region.value
        })
    });
    console.log(region.value);
    //reload quizzes
    loadQuizzes();
};

// -------------------------
// CREATE QUESTION
// -------------------------
addQuestionForm.onsubmit = async e => {
    e.preventDefault();

    if (!selectedQuiz) {
        alert("Select a quiz first");
        return;
    }

    await fetch("/admin/add-question", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        credentials: "include",
        body: JSON.stringify({
            quizID: Number(selectedQuiz),
            question: questionText.value,
            answer: answerText.value
        })
    });

    loadQuestions(selectedQuiz, selectedQuizTitle);
};

// -------------------------
// DELETE QUESTION
// -------------------------
async function deleteQuestion(id) {
    await fetch("/admin/delete-question", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        credentials: "include",
        body: JSON.stringify({ questionID: id })
    });

    loadQuestions(selectedQuiz, selectedTitle.innerText);
}

loadQuizzes();

