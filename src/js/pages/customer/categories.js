import {getCategories} from '../../api/categories'

const categoriesContainer = document.getElementById("categories-container");

async function renderUi() {

  try {
    const categories = await getCategories();
    console.log(categories)
    // renderCategories(categories)

  } catch (error) {
    // Error state
    console.error(error);
  }
}

renderUi();

function renderCategories(categories) {

  let html = "";
  categories.forEach((category) => {
    html += `
     <option value="">${category.name}</option>
    `;
  });

  categoriesContainer.innerHTML = html;
}
