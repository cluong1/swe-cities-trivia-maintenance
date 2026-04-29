
//Handle registering accounts
document.getElementById("accountSubmissionForm")?.addEventListener("submit",async(e)=>{
    e.preventDefault();

    const username = document.getElementById("createUsername").value;
    const password= document.getElementById("createPassword").value;

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