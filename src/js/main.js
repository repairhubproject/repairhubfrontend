
const searchBox =
  document.querySelectorAll(
    ".search-box"
  );


if (searchBox) {
  searchBox.forEach((search) => {

    search.addEventListener(
      "click",
      () => {
  
        window.location.href =
          "/pages/customer/technicians.html";
  
      }
    );
  })

}


function renderUserProfile() {

  const user =
    JSON.parse(
      localStorage.getItem(
        "user"
      )
    );


  const userName =
    document.getElementById(
      "header-name"
    );


  const userAvatar =
    document.getElementById(
      "header-avatar"
    );


  // Stop if elements don't exist
  if (
    !user ||
    !userName ||
    !userAvatar
  ) {
    return;
  }


  // Display full name
  const firstName =
  user.name.split(" ")[0];

  userName.textContent = firstName



  // Get first letter
  const firstLetter =
    user.name
      .charAt(0)
      .toUpperCase();


  userAvatar.textContent =
    firstLetter;

}


renderUserProfile();
