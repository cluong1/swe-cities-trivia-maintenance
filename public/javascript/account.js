
//Handle registering accounts
document.getElementById("accountSubmissionForm")?.addEventListener("submit",async(e)=>{
    e.preventDefault();

    const username = document.getElementById("createUsername").value;
    const password= document.getElementById("createPassword").value;

    const hasCapital = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[._!-]/.test(password);


    if (!hasCapital || !hasNumber || !hasSymbol) {
        let errors = [];
        if (!hasCapital) errors.push("at least one capital letter");
        if (!hasNumber) errors.push("at least one number");
        if (!hasSymbol) errors.push("and at least one of these symbols:  . _ ! -");
        alert("Password must contain " + errors.join(", "));
        return;
    }   

    //post request to server.js
    const res=await fetch("/register", {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({username,password})
    });

    const text = await res.text();
    alert(text);

    if(res.ok) {
        location.reload();
    }
});

//handle logging into account
document.getElementById("accountLoginForm")?.addEventListener("submit", async(e)=>{
    e.preventDefault();

    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    //send login request to server.js
    const res = await fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({username,password})
    });

    const text=  await res.text();
    alert(text);

    if(res.ok) {
        location.reload();

    }
});

