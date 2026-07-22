
// dropdown.js

export function openDropdown(dropdown) {
    dropdown.classList.remove("hidden");
}

export function closeDropdown(dropdown) {
    dropdown.classList.add("hidden");
}

export function toggleDropdown(dropdown) {
    dropdown.classList.toggle("hidden");
}

export function closeAllDropdowns() {

    document
        .querySelectorAll(".dropdown")
        .forEach(dropdown => {

            dropdown.classList.add("hidden");

        });

}

export function initDropdown(button, menu) {

    button.addEventListener("click", () => {

        toggleDropdown(menu);

    });

}