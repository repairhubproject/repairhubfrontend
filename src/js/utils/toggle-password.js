export function togglePassword(passwordInput, togglePasswordButton, eyeIcon) {

  console.log("im here")
  const isPasswordHidden = passwordInput.type === "password";

  if (isPasswordHidden) {
    passwordInput.type = "text";

    eyeIcon.classList.remove("ph-eye");
    eyeIcon.classList.add("ph-eye-slash");

    togglePasswordButton.setAttribute("aria-label", "Hide password");
  } else {
    passwordInput.type = "password";

    eyeIcon.classList.remove("ph-eye-slash");
    eyeIcon.classList.add("ph-eye");

    togglePasswordButton.setAttribute("aria-label", "Show password");
  }
}
