const quizList = document.getElementById("quizList");
const questionList = document.getElementById("questionList");
const selectedTitle = document.getElementById("selectedTitle");
const createQuizForm = document.getElementById("createQuizForm");
const addQuestionForm = document.getElementById("addQuestionForm");
const quizTitle = document.getElementById("quizTitle");
const isDaily = document.getElementById("isDaily");
const questionText = document.getElementById("questionText");
const answerText = document.getElementById("answerText");

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

    li.innerHTML = `
        ${q.Title}
        <button onclick="deleteQuiz(${q.QuizID}); event.stopPropagation();">Select</button>
    `;

    li.onclick = () => {
        loadQuestions(q.QuizID, q.Title);
        selectedQuiz = q.QuizID;
        selectedQuizTitle = q.Title;
    };

    if (selectedQuiz === q.QuizID) {
        li.classList.add("selected");
    }

    quizList.appendChild(li);
});
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

        li.innerHTML = `
            ${q.Question} (Answer: ${q.Answer})
            <button onclick="deleteQuestion(${q.QuestionID}); event.stopPropagation();">
                Delete
            </button>
        `;

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
            isDaily: isDaily.checked
        })
    });

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


