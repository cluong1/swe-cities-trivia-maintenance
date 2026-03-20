//With the use of a SQL server we can load the questions into an array 

// I think that one way to do the questions is we assign 
// them types which will determine alln teh potential answers the
// y are paried with for example city, COunty, State, Number. Then we select 
// that specific answerr for the qwuestion and three random ansers of the same type.
// we can also 

const questions = [
  ["What is the capital of the USA?", "Washington, D.C."],
  ["What is the most populous city in Europe?", "Istanbul"],
  ["What is the capital of India?", "New Delhi"],
  ["Which city here would you nuke?", "Paris"],
  ["What is the capital of Germany?", "Berlin"],
  ["What us city is named Austin", "Austin"],
  ["What is the capital of Canada?", "Ottawa"],
  ["What is the capital of Finland?", "Helsinki"],
  ["What is the capital of Japan?", "Tokyo"],
  ["What is the capital of Spain?", "Madrid"]
];

//this represents the incorect answers i dont know exactly how to do this with
//my sql but we copuld probably jujst take in a speciific amount of things
const cities = [
  // --- New Capitals (28 total) ---
  "Amsterdam", "Brussels", "Copenhagen", "Dublin", "Lisbon",
  "Prague", "Budapest", "Warsaw", "Athens", "Zurich",
  "Reykjavik", "Tallinn", "Riga", "Vilnius", "Sofia",
  "Bucharest", "Belgrade", "Zagreb", "Ljubljana", "Bratislava",
  "Doha", "Abu Dhabi", "Kuala Lumpur", "Singapore", "Hanoi",
  "Manila", "Lima", "Santiago",

  // --- Non-Capital Cities (25 total) ---
  "New York", "Los Angeles", "Chicago", "Houston", "Toronto",
  "Vancouver", "Sydney", "Melbourne", "São Paulo", "Rio de Janeiro",
  "Shanghai", "Mumbai", "Bangalore", "Istanbul", "Dubai",
  "Johannesburg", "Cape Town", "Barcelona", "Munich", "Milan",
  "Lyon", "Manchester", "Busan", "Osaka", "Auckland"
];

//ABOVE THIS WILL BE REPLACED BY SQL
//when im done im goiung to mnake variabales for all the getelemebnt by id so its cleaner
let output = document.getElementById("output");
let startButton = document.getElementById("startButton");


let score = 0;
let timeLeft = 10;
let timer;
let correctAnswer = "";
let answerShow = 0;

function startQuiz() {
  index = 0;
  showQuestion();
  startButton.style.display = "none";
  answerShow = 1;
}


startButton.addEventListener("click", startQuiz);


function showQuestion(){
    correctAnswer = questions[index][1];

    document.getElementById("question").textContent = questions[index][0];
    //setAnswers creates the answer buttons including the correct one
    setAnswers(index);
    document.getElementById("questionIndex").textContent = `${index+1}/10`;
    document.getElementById("score").textContent = `${score} /1000`;
    timeLeft = 10;
    document.getElementById("timer").textContent = `Time : ${timeLeft}`;

    clearInterval(timer);

    timer = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").textContent = `Time: ${timeLeft}`;
    
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
  } else {
    document.getElementById("question").textContent = `Quiz finished!` ;
    document.getElementById("timer").textContent = "";
    setAnswerButtons("Cities", "go", "here", "(:");
    startButton.style.display = "block";
    output.textContent = "";
    score = 0;
    answerShow = 0;
  }
}


function setAnswers(index){
    //This gets a number 1-4 for the position of the correct ans
    const ans = Math.floor(Math.random() * 4) + 1;
    //this selects the other three incoredct answeres
    const inccorects = getThreeUnique(0,50);
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

//this is to get three numbers that are not the same so that i can get gunique incorect answers
function getThreeUnique(min, max) {
  const arr = [];
  for (let i = min; i <= max; i++) arr.push(i);
  // shuffle
  arr.sort(() => Math.random() - 0.5);

  return arr.slice(0, 3);
}

//Takes in four strings to be displayed on the buttons (simplifies earlier code)
function setAnswerButtons(one, two, three, four){
    document.getElementById("ans1").textContent = one;
    document.getElementById("ans2").textContent = two;
    document.getElementById("ans3").textContent = three;
    document.getElementById("ans4").textContent = four;
}

document.getElementById("ans1").addEventListener("click", handleAnswer);
document.getElementById("ans2").addEventListener("click", handleAnswer);
document.getElementById("ans3").addEventListener("click", handleAnswer);
document.getElementById("ans4").addEventListener("click", handleAnswer);

function handleAnswer(event) {
  const selected = event.target.textContent;

  clearInterval(timer);

  if (selected === correctAnswer) {
    score = score + timeLeft * 10;
    output.textContent = "Correct!";
  } else {
    if(answerShow){
      output.textContent = "Incorrect";
    }
    
  }

  setTimeout(nextQuestion, 300);
}