
export function generateRatingStars(rating) {
    let stars = "";

    const fullStars = Math.floor(rating);

    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            stars += `<i class="ph-fill ph-star text-xl text-yellow-400"></i>`;
        } else {
            stars += `<i class="ph-fill ph-star text-xl text-gray-300"></i>`;
        }
    }

    return stars;
}