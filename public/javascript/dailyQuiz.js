document.addEventListener("DOMContentLoaded", () => {
    // From quiz.ejs
    // questions = [[Question,answer,points]]
    // cities =[answer]

    // -------------------------
    // ELEMENTS
    // -------------------------
    const output = document.getElementById("output");
    const startButton = document.getElementById("startButton");
    const question = document.getElementById("question");
    const questionIndex = document.getElementById("questionIndex");
    const scoreDisplay = document.getElementById("score");
    const timerDisplay = document.getElementById("timer");

    const answerBox1 = document.getElementById("ans1");
    const answerBox2 = document.getElementById("ans2");
    const answerBox3 = document.getElementById("ans3");
    const answerBox4 = document.getElementById("ans4");

    const answerButtons = [
        answerBox1,
        answerBox2,
        answerBox3,
        answerBox4
    ];

    // -------------------------
    // STATE
    // -------------------------
    let score = 0;
    let timeLeft = 10;
    let timer = null;
    let correctAnswer = "";
    let index = 0;

    // Hide answer buttons initially
    answerButtons.forEach(btn => {
        btn.style.display = "none";
    });

    // -------------------------
    // UI HELPERS
    // -------------------------
    function updateScoreUI() {
        scoreDisplay.textContent = score;
    }

    function resetButtons() {
        answerButtons.forEach(btn => {
            btn.classList.remove("correct-btn", "wrong-btn");
            btn.disabled = false;
        });
    }

    function disableButtons() {
        answerButtons.forEach(btn => {
            btn.disabled = true;
        });
    }

    // -------------------------
    // START QUIZ
    // -------------------------
    function startQuiz() {
        score = 0;
        index = 0;

        updateScoreUI();

        startButton.style.display = "none";

        answerButtons.forEach(btn => {
            btn.style.display = "block";
        });

        showQuestion();
    }

    startButton.addEventListener("click", startQuiz);

    // -------------------------
    // SHOW QUESTION
    // -------------------------
    function showQuestion() {
        resetButtons();

        if (index >= questions.length) {
            endQuiz();
            return;
        }

        correctAnswer = questions[index][1];
        question.textContent = questions[index][0];
        questionIndex.textContent = `${index + 1}/${questions.length}`;
        output.textContent = "";

        setAnswers(index);

        timeLeft = 10;
        timerDisplay.textContent = timeLeft;

        clearInterval(timer);

        timer = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(timer);
                output.textContent = "Time Over!";
                disableButtons();

                setTimeout(() => {
                    nextQuestion();
                }, 1000);
            }
        }, 1000);
    }

    // -------------------------
    // HANDLE ANSWER
    // -------------------------
    function handleAnswer(e) {
        clearInterval(timer);

        const selected = e.target.textContent;

        disableButtons();

        // If wrong answer selected
        if (selected !== correctAnswer) {
            e.target.classList.add("wrong-btn");
            output.textContent = "Incorrect!";
            showWrongX();
        }

        // ALWAYS highlight the correct answer
        answerButtons.forEach(btn => {
            if (btn.textContent === correctAnswer) {
                btn.classList.add("correct-btn");
            }
        });

        // If correct answer selected
        if (selected === correctAnswer) {
            score += Math.max(1, timeLeft) * 10;
            output.textContent = "Correct!";
            showCorrectCheck();
        }

        updateScoreUI();

        setTimeout(() => {
            nextQuestion();
        }, 1000);
    }
    // -------------------------
    // NEXT QUESTION
    // -------------------------
    function nextQuestion() {
        index++;
        showQuestion();
    }

    // -------------------------
    // END QUIZ
    // -------------------------
    function endQuiz() {
        clearInterval(timer);

        question.textContent = "";
        timerDisplay.textContent = "";

        answerButtons.forEach(btn => {
            btn.style.display = "none";
        });

        document.getElementById("modal-score").textContent =
            `Your score: ${score}`;

        document.getElementById("modal").style.display = "flex";

        submitAnswers();
    }

    // -------------------------
    // SET ANSWERS
    // -------------------------
    function setAnswers(index) {
        const correct = questions[index][1];

        const correctCityIndex = cities.indexOf(correct);
        const incorrects = getThreeUnique(
            0,
            cities.length - 1,
            correctCityIndex
        );

        const answers = [
            correct,
            cities[incorrects[0]],
            cities[incorrects[1]],
            cities[incorrects[2]]
        ];

        // shuffle answers
        answers.sort(() => Math.random() - 0.5);

        answerButtons.forEach((btn, i) => {
            btn.textContent = answers[i];
        });
    }

    function getThreeUnique(min, max, excludeIndex) {
        const arr = [];

        for (let i = min; i <= max; i++) {
            if (i !== excludeIndex) {
                arr.push(i);
            }
        }

        arr.sort(() => Math.random() - 0.5);

        return arr.slice(0, 3);
    }

    // -------------------------
    // ANIMATIONS
    // -------------------------
    function showCorrectCheck() {
        const check = document.createElement("div");
        check.classList.add("big-check");
        check.innerText = "✅";

        document.body.appendChild(check);

        setTimeout(() => {
            check.remove();
        }, 600);
    }

    function showWrongX() {
        const x = document.createElement("div");
        x.classList.add("big-x");
        x.innerText = "❌";

        document.body.appendChild(x);

        setTimeout(() => {
            x.remove();
        }, 600);
    }

    // -------------------------
    // EVENT LISTENERS
    // -------------------------
    answerButtons.forEach(btn => {
        btn.addEventListener("click", handleAnswer);
    });

    // -------------------------
    // SAVE SCORE
    // -------------------------
    function submitAnswers() {
        //received in server.js
        fetch("/api/save-score", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                score: score,
                quizID: quizID
            })
        })
        .then(res => res.json())
        .then(data => console.log(data))
        .catch(err => console.error(err));
    }
});