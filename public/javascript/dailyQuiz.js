
//From database
//  questions = [[Question,answer,points]]
//  cities =[answer]
let output =        document.getElementById("output");
let startButton =   document.getElementById("startButton");
let question =      document.getElementById("question");
let questionIndex = document.getElementById("questionIndex");
let scoreDisplay =  document.getElementById("score")
let timerDisplay =  document.getElementById("timer");
let answerBox1 =    document.getElementById("ans1");
let answerBox2=     document.getElementById("ans2");
let answerBox3 =    document.getElementById("ans3");
let answerBox4 =    document.getElementById("ans4");


let score = 0;
let timeLeft = 10;
let timer;
let correctAnswer = "";
let answerArray = [];
let timesArray = [];
let pointsMultiplier = 1;

// Hide answer buttons initially
answerBox1.style.display = "none";
answerBox2.style.display = "none";
answerBox3.style.display = "none";
answerBox4.style.display = "none";


//function ran at the start of every quiz
function startQuiz() {
  scoreDisplay.textContent = (`${score}`);
  index = 0;
  showQuestion();
  startButton.style.display = "none";
  answerBox1.style.display = "block";
  answerBox2.style.display = "block";
  answerBox3.style.display = "block";
  answerBox4.style.display = "block";
}


startButton.addEventListener("click", startQuiz);





function showQuestion(){

  answerBox1.disabled = false;
  answerBox2.disabled = false;
  answerBox3.disabled = false;
  answerBox4.disabled = false;
  
    correctAnswer = questions[index][1];

    question.textContent = questions[index][0];
    //setAnswers creates the answer buttons including the correct one
    setAnswers(index);
    questionIndex.textContent = `${index+1}/${questions.length}`;
    
    timeLeft = 10;
    timerDisplay.textContent = `Time : ${timeLeft}`;

    clearInterval(timer);

    timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = `Time: ${timeLeft}`;
    
    if(timeLeft === 9){
        output.textContent= "";
    }

    if (timeLeft === 0) {
      clearInterval(timer);
      setTimeout(nextQuestion,100); 
      output.textContent= "TIME OVER";
    }

  }, 1000);

}

function nextQuestion() {
  index++;
   
  if (index < questions.length) {
    showQuestion();
  } else {//end of quiz
    document.getElementById("question").textContent = "";
    document.getElementById("timer").textContent = "";
    answerBox1.style.display = "none";
    answerBox2.style.display = "none";
    answerBox3.style.display = "none";
    answerBox4.style.display = "none";
    startButton.style.display = "none";
    output.textContent = "";

    // Show modal
    document.getElementById("modal-score").textContent = `Your score: ${score}`;
    document.getElementById("modal").style.display = "flex";

    submitAnswers();
    answerArray = [];
    score = 0;  
  }
}


function setAnswers(index){
    //This gets a number 1-4 for the position of the correct ans
    const ans = Math.floor(Math.random() * 4) + 1;
    //Find the index of the correct answer to exclude it from incorrect answers
    const correctCityIndex = cities.indexOf(questions[index][1]);
    //this selects the other three incoredct answeres
    const inccorects = getThreeUnique(0, cities.length - 1, correctCityIndex);
    const inc1= inccorects[0];
    const inc2= inccorects[1];
    const inc3 = inccorects[2];

    if(ans === 1){
       setAnswerButtons(questions[index][1], cities[inc1], cities[inc2],cities[inc3]);
    }else if (ans === 2){
        setAnswerButtons( cities[inc1],questions[index][1], cities[inc2],cities[inc3]);
    }else if (ans === 3){
        setAnswerButtons( cities[inc1], cities[inc2],questions[index][1], cities[inc3]);
    }else{
       setAnswerButtons( cities[inc1], cities[inc2],cities[inc3], questions[index][1],);
    }
    

}

//this is to get three numbers that are not the same so that i can get unique incorect answers
function getThreeUnique(min, max, excludeIndex) {
  const arr = [];
  for (let i = min; i <= max; i++) {
    if (i !== excludeIndex) arr.push(i);
  }
  // shuffle
  arr.sort(() => Math.random() - 0.5);

  return arr.slice(0, 3);
}

//Takes in four strings to be displayed on the buttons (simplifies earlier code)
function setAnswerButtons(one, two, three, four){
    answerBox1.textContent = one;
    answerBox2.textContent = two;
    answerBox3.textContent = three;
    answerBox4.textContent = four;
}

answerBox1.addEventListener("click", handleAnswer);
answerBox2.addEventListener("click", handleAnswer);
answerBox3.addEventListener("click", handleAnswer);
answerBox4.addEventListener("click", handleAnswer);


function handleAnswer(event) {
  const selected = event.target.textContent; 

  clearInterval(timer);

  answerBox1.disabled = true;
  answerBox2.disabled = true;
  answerBox3.disabled = true;
  answerBox4.disabled = true;


  if (selected === correctAnswer) {
    score = score + timeLeft * 10 * questions[index][2];
    output.textContent = "Correct!";
    answerArray.push(correctAnswer);
    timesArray.push(timeLeft);
  } else {
    output.textContent = "Incorrect";
    answerArray.push("incorrect Answer");
    timesArray.push(timeLeft);
  }
  //scoreDisplay.textContent = `${score}/${questions.length * 100}`;
  scoreDisplay.textContent = `${score}`;
  setTimeout(nextQuestion, 300);
}

function submitAnswers(){
  console.log(score);
    fetch("/api/save-score", {
    method: "POST",
    headers: {
    "Content-Type": "application/json"
    },
    body: JSON.stringify({ score:score,answerArray: answerArray,questions: questions,timesArray:timesArray })
})

.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));


}
console.log(cities);