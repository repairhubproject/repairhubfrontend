import { getProtectedRequest } from "./api";

export async function getCategories() {
    try {
        const data = await getProtectedRequest("/categories");

        return data.categories;
        
    } catch (error) {
        console.error(error);
        return [];
    }
}