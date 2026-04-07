document.getElementById("accountSubmissionForm")?.addEventListener("submit",async(e)=>{
    e.preventDefault();

    const username = document.getElementById("createUsername").value;
    const password= document.getElementById("createPassword").value;

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

document.getElementById("accountLoginForm")?.addEventListener("submit", async(e)=>{
    e.preventDefault();

    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

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