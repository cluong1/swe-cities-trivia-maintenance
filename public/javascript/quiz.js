document.addEventListener("DOMContentLoaded", () => {
// From quiz.ejs
// questions = [[Question,answer,points]]
// cities =[answer]
let output =        document.getElementById("output");
let startButton =   document.getElementById("startButton");
let question =      document.getElementById("question");
let questionIndex = document.getElementById("questionIndex");
let scoreDisplay =  document.getElementById("score");
let timerDisplay =  document.getElementById("timer");

let answerBox1 = document.getElementById("ans1");
let answerBox2 = document.getElementById("ans2");
let answerBox3 = document.getElementById("ans3");
let answerBox4 = document.getElementById("ans4");

let score = 0;
let timeLeft = 10;
let timer;
let timerActive = false;
let correctAnswer = "";
let index = 0;

// -------------------------
// BIG X ANIMATION
// -------------------------
function showWrongX() {
    const x = document.createElement("div");
    x.classList.add("big-x");
    x.innerText = "❌";
    document.body.appendChild(x);

    setTimeout(() => x.remove(), 600);
}

// -------------------------
// BIG check ANIMATION
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

// -------------------------
// 🎞 SLIDE ANIMATION
// -------------------------
function animateNextQuestion() {
    const card = document.querySelector(".quiz-card");

    card.classList.add("slide-out-left");

    setTimeout(() => {
        nextQuestion();

        card.classList.remove("slide-out-left");
        card.classList.add("slide-in-right");

        setTimeout(() => {
            card.classList.remove("slide-in-right");
        }, 300);

    }, 300);
}

// -------------------------
// INITIAL STATE
// -------------------------
answerBox1.style.display = "none";
answerBox2.style.display = "none";
answerBox3.style.display = "none";
answerBox4.style.display = "none";

// -------------------------
// START QUIZ
// -------------------------
function startQuiz() {
  scoreDisplay.textContent = score;
  index = 0;
  

  startButton.style.display = "none";

  answerBox1.style.display = "block";
  answerBox2.style.display = "block";
  answerBox3.style.display = "block";
  answerBox4.style.display = "block";

  showQuestion();
}

startButton.addEventListener("click", startQuiz);

// -------------------------
// SHOW QUESTION
// -------------------------
function showQuestion() {
  //output is the line that says incorrect and correct at the bottom
  output.textContent = "";

   // 🔥 RESET VISUAL STATE (IMPORTANT)
  [answerBox1, answerBox2, answerBox3, answerBox4].forEach(btn => {
    btn.classList.remove("correct-btn", "wrong-btn");
    btn.disabled = false;
  });

  correctAnswer = questions[index][1];
  question.textContent = questions[index][0];

  setAnswers(index);

  questionIndex.textContent = `${index + 1}/${questions.length}`;

  timeLeft = 10;
  timerDisplay.textContent = `Time: ${timeLeft}`;

  timerActive = false;
  clearInterval(timer);
  timerActive = true;

  timer = setInterval(() => {
    if (!timerActive) return;
    
    timeLeft--;
    timerDisplay.textContent = `Time: ${timeLeft}`;

    if (timeLeft === 0) {
      timerActive = false;
      clearInterval(timer);
      output.textContent = "TIME OVER";
      setTimeout(animateNextQuestion, 300);
    }
  }, 1000);

  answerBox1.disabled = false;
  answerBox2.disabled = false;
  answerBox3.disabled = false;
  answerBox4.disabled = false;
}

// -------------------------
// NEXT QUESTION
// -------------------------
function nextQuestion() {
  index++;
  if (index < questions.length) {
    showQuestion();
  } else {
    question.textContent = "Quiz finished!";
    timerDisplay.textContent = "";

    answerBox1.style.display = "none";
    answerBox2.style.display = "none";
    answerBox3.style.display = "none";
    answerBox4.style.display = "none";

    startButton.style.display = "block";

    output.textContent = "";

    
    score = 0;
  }
}

// -------------------------
// ANSWERS
// -------------------------
//this selects a random index for the correct answer to be at and sets it with the setAnswer buttons function. the order of the incorects does not matter.
function setAnswers(index) {
  const ans = Math.floor(Math.random() * 4) + 1;
  const correctCityIndex = cities.indexOf(questions[index][1]);
  const incorrects = getThreeUnique(0, cities.length - 1, correctCityIndex);

  if (ans === 1) {
    setAnswerButtons(questions[index][1], cities[incorrects[0]], cities[incorrects[1]], cities[incorrects[2]]);
  } else if (ans === 2) {
    setAnswerButtons(cities[incorrects[0]], questions[index][1], cities[incorrects[1]], cities[incorrects[2]]);
  } else if (ans === 3) {
    setAnswerButtons(cities[incorrects[0]], cities[incorrects[1]], questions[index][1], cities[incorrects[2]]);
  } else {
    setAnswerButtons(cities[incorrects[0]], cities[incorrects[1]], cities[incorrects[2]], questions[index][1]);
  }
}
//this select three random numbers between min and max exlcuding excludeIndex
function getThreeUnique(min, max, excludeIndex) {
  const arr = [];
  for (let i = min; i <= max; i++) {
    if (i !== excludeIndex) arr.push(i);
  }
  arr.sort(() => Math.random() - 0.5);
  return arr.slice(0, 3);
}
//this is just a shortcut for setting answers button text content 
function setAnswerButtons(one, two, three, four) {
  answerBox1.textContent = one;
  answerBox2.textContent = two;
  answerBox3.textContent = three;
  answerBox4.textContent = four;
}

// -------------------------
// HANDLE ANSWER
// -------------------------
function handleAnswer(event) {
  const selected = event.target.textContent;

  timerActive = false;
  clearInterval(timer);

  answerBox1.disabled = true;
  answerBox2.disabled = true;
  answerBox3.disabled = true;
  answerBox4.disabled = true;

  // ❌ wrong
  if (selected !== correctAnswer) {
    output.textContent = "Incorrect";
    event.target.classList.add("wrong-btn");
    showWrongX();
  }

  // ✅ correct (always highlight correct answer)
  [answerBox1, answerBox2, answerBox3, answerBox4].forEach(btn => {
    if (btn.textContent === correctAnswer) {
      btn.classList.add("correct-btn");
    }
  });

  if (selected === correctAnswer) {
    score += timeLeft * 10;
    output.textContent = "Correct!";
    showCorrectCheck();
  }

  scoreDisplay.textContent = score;

  setTimeout(animateNextQuestion, 700); // slight delay so user sees highlight
}

answerBox1.addEventListener("click", handleAnswer);
answerBox2.addEventListener("click", handleAnswer);
answerBox3.addEventListener("click", handleAnswer);
answerBox4.addEventListener("click", handleAnswer);




});