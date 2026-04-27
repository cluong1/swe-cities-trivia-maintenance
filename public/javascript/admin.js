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

async function loadQuizzes() {
    const res = await fetch("/admin/quizzes", { credentials: "include" });

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

async function deleteQuiz(id) {
    if (!confirm("Delete this quiz?")) return;

    await fetch("/admin/delete-quiz", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        credentials: "include",
        body: JSON.stringify({ quizID: id })
    });

    if (selectedQuiz === id) {
        selectedQuiz = null;
        selectedQuizTitle = null;
        questionList.innerHTML = "";
        selectedTitle.innerText = "";
    }

    loadQuizzes();
}

async function loadQuestions(id, title) {
    selectedQuiz = Number(id);
    selectedQuizTitle = title;

    selectedTitle.innerText = title;

    const res = await fetch(`/admin/questions/${id}`, {
        credentials: "include"
    });

    const data = await res.json();

    questionList.innerHTML = "";

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

createQuizForm.onsubmit = async e => {
    e.preventDefault();

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
    loadQuizzes();
};

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

