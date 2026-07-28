const user = JSON.parse(localStorage.getItem("user"));



const headerA = document.getElementById("header-avatar");
const headerB = document.getElementById("header-name");

if (user) {
    
    headerA.textContent = user.name.charAt(0).toUpperCase();
    headerB.textContent = user.name
}