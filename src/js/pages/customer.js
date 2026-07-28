const user = JSON.parse(localStorage.getItem("user"));


const avatar = document.getElementById("profile-avatar");
const greeting = document.getElementById("profile-name");
const headerA = document.getElementById("header-avatar");
const headerB = document.getElementById("header-name");

if (user) {
    avatar.textContent = user.name.charAt(0).toUpperCase();
    greeting.textContent = `Hi, ${user.name}`;
    headerA.textContent = user.name.charAt(0).toUpperCase();
    headerB.textContent = user.name
}