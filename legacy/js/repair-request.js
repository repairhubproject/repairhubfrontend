const categoryCards = document.querySelectorAll(".category-card");

categoryCards.forEach((card) => {

    card.addEventListener("click", () => {

        categoryCards.forEach((item) => {
            item.classList.remove("selected");
        });

        card.classList.add("selected");

    });

});