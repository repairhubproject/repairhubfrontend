
// modal.js

let activeModal = null;

export function openModal(modalId) {
    const modal = document.getElementById(modalId);

    if (!modal) return;

    modal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");

    activeModal = modal;
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);

    if (!modal) return;

    modal.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");

    activeModal = null;
}

export function closeActiveModal() {
    if (activeModal) {
        activeModal.classList.add("hidden");
        document.body.classList.remove("overflow-hidden");
    }
}

export function initModal() {
    document.addEventListener("click", (e) => {

        if (e.target.dataset.modalOpen) {
            openModal(e.target.dataset.modalOpen);
        }

        if (e.target.dataset.modalClose) {
            closeModal(e.target.dataset.modalClose);
        }

    });
}