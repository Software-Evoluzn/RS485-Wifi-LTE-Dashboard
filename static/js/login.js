document.addEventListener("DOMContentLoaded", function () {
    const togglePasswordButtons = document.querySelectorAll("[id^=togglePassword]");

    togglePasswordButtons.forEach(toggleButton => {
        toggleButton.addEventListener("click", function () {
            const passwordInput = this.previousElementSibling;
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            this.innerHTML = type === "password" ? '<img style="width: 22px; height: 22px;" src="../static/img/eye_open.svg" alt="Not shown">' :
                '<img style="width: 22px; height: 22px;" src="../static/img/eye_close.svg" alt="Not shown">';
        });
    });
});


function showLogin() {
    document.getElementById("loginForm").classList.remove("hidden");
    document.getElementById("registerForm").classList.add("hidden");
    document.getElementById("loginBtn").classList.add("active");
    document.getElementById("registerBtn").classList.remove("active");
}

function showRegister() {
    document.getElementById("registerForm").classList.remove("hidden");
    document.getElementById("loginForm").classList.add("hidden");
    document.getElementById("registerBtn").classList.add("active");
    document.getElementById("loginBtn").classList.remove("active");
}

document.getElementById("loginFormElem").addEventListener("submit", function (event) {
    event.preventDefault();

    let email = document.getElementById("login_email").value.trim();
    let password = document.getElementById("login_password").value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    })
        .then(res => res.json())
        .then(data => {
            if (data.status === "success") {
                alert("Login successful");
                window.location.href = "/devices";
            } else {
                alert(data.message);
            }
        });
});


document.getElementById("registerFormElem").addEventListener("submit", function (event) {
    event.preventDefault();
    let full_name = document.getElementById("company_name").value;
    let email = document.getElementById("register_email").value;
    let password = document.getElementById("register_password").value;

    let rtu = document.getElementById("rtuHidden").value;
    let temperature = document.getElementById("tempHidden").value;
    let voltage = document.getElementById("voltHidden").value;
    let current = document.getElementById("currHidden").value;
    let power = document.getElementById("powerHidden").value;

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: full_name,
            email: email,
            password: password,
            rtu_no: rtu,
            temperature: temperature,
            voltage: voltage,
            current: current,
            power: power
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert("Register Successful!");
                showLogin();
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error("Error:", error);
        });
});
