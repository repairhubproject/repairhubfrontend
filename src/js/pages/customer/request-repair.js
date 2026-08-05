import {getCategories} from '../../api/categories.js'
import { createRepairRequest } from "../../api/request-repair-api.js";
import {getLocationFromCoordinates} from "../../api/location.js";
import {getUploadSignature} from "../../api/upload-api.js";

const categoryContainer = document.getElementById('category')

async function renderCategories () {
  const categories = await getCategories()
  
  let html = ""

  html+= '<option value="" selected disabled> Select a category </option>'
  
  categories.forEach((category) => {
    html+= `
     <option value="${category.id}"> ${category.name} </option> 
    `
  })

  categoryContainer.innerHTML = html
}

renderCategories()



const locationInput =
  document.getElementById("location");

const getLocationBtn =
  document.getElementById("get-location-btn");

const locationMessage =
  document.getElementById("loction-btn-text");


getLocationBtn.addEventListener("click", () => {

  // Check if the browser supports GPS
  if (!navigator.geolocation) {
    alert(
      "Your browser does not support location services."
    );

    return;
  }

  // Show loading state
  locationMessage.textContent =
    "loading...";

  getLocationBtn.disabled = true;


  navigator.geolocation.getCurrentPosition(

    // Runs after the browser gets the GPS coordinates
    async (position) => {
      const lat =
        position.coords.latitude;

      const lng =
        position.coords.longitude;

      try {
        // Send GPS coordinates to the backend
        const data =
          await getLocationFromCoordinates(lat, lng);

        console.log(data);

        /*
          Check the API response and use
          the correct property here.
        */

        locationInput.value = data.location.display_name;

        alert(
          "Location added successfully."
        );

      } catch (error) {
        console.error(error);

        alert(
          error.message ||
          "Unable to get your address."
        );

      } finally {
        // Restore the button
        locationMessage.textContent =
          "Use GPS";

        getLocationBtn.disabled =
          false;
      }
    },

    // Runs when GPS permission is denied
    // or the browser cannot get the location
    (error) => {
      console.error(error);

      if (
        error.code ===
        error.PERMISSION_DENIED
      ) {
        alert(
          "Location permission was denied. Please enter your location manually."
        );

      } else {
        alert(
          "Unable to get your GPS location. Please enter your location manually."
        );
      }

      getLocationBtn.textContent =
        "Use GPS";

      getLocationBtn.disabled =
        false;
    }
  );
});



const photoInput = document.getElementById("photo-input");
const addPhotoBtn = document.getElementById("add-photo-btn");
const photoPreviewContainer = document.getElementById(
  "photo-preview-container"
);

// Store all selected photos here
const selectedPhotos = [];

// Open the file picker when the box is clicked
addPhotoBtn.addEventListener("click", () => {
  photoInput.click();
});

// Run when the user selects photos
photoInput.addEventListener("change", () => {
  const newPhotos = Array.from(photoInput.files);

  newPhotos.forEach((photo) => {
    // Add the photo to the array
    selectedPhotos.push(photo);

    // Create a temporary URL for the preview
    const photoUrl = URL.createObjectURL(photo);

    // Create the preview element
    const photoCard = document.createElement("div");

    photoCard.className =
      "relative w-[120px] h-[130px] overflow-hidden rounded-lg";

    photoCard.innerHTML = `
      <img
        src="${photoUrl}"
        alt="Selected repair photo"
        class="h-full w-full object-cover"
      />

      <button
        type="button"
        class="remove-photo-btn absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"
      >
        ×
      </button>
    `;

    // Put the photo before the Add Photo box
    photoPreviewContainer.insertBefore(
      photoCard,
      addPhotoBtn
    );

    // Remove the photo
    const removeButton = photoCard.querySelector(
      ".remove-photo-btn"
    );

    removeButton.addEventListener("click", () => {
      const photoIndex = selectedPhotos.indexOf(photo);

      if (photoIndex !== -1) {
        selectedPhotos.splice(photoIndex, 1);
      }

      URL.revokeObjectURL(photoUrl);

      photoCard.remove();
    });
  });

  // Clear the input so the same image can be selected again
  photoInput.value = "";
});


async function uploadPhoto(photo) {

  // Get signed upload information
  const signatureData = await getUploadSignature();

  // Create FormData for Cloudinary
  const cloudinaryFormData = new FormData();

  // Add the image file
  cloudinaryFormData.append(
    "file",
    photo
  );

  // Add Cloudinary credentials
  cloudinaryFormData.append(
    "api_key",
    signatureData.api_key
  );

  cloudinaryFormData.append(
    "timestamp",
    signatureData.timestamp
  );

  cloudinaryFormData.append(
    "signature",
    signatureData.signature
  );

  // Add folder if provided
  if (signatureData.folder) {

    cloudinaryFormData.append(
      "folder",
      signatureData.folder
    );

  }

  // Upload directly to Cloudinary
  const response =
    await fetch(
      signatureData.upload_url,
      {
        method: "POST",
        body: cloudinaryFormData
      }
    );

  const uploadResult =
    await response.json();

  // Handle upload failure
  if (!response.ok) {

    throw new Error(
      uploadResult.error?.message ||
      "Photo upload failed"
    );
  }

  if (!uploadResult.secure_url) {
    throw new Error(
      "Cloudinary did not return a photo URL."
    );
  }
  // Return the image URL
  return uploadResult.secure_url;
}


async function uploadAllPhotos() {
  const photoUrls = [];

  for (const photo of selectedPhotos) {

    const photoUrl = await uploadPhoto(photo);

    photoUrls.push(photoUrl);

  }

  return photoUrls;
}

    // form submission 
const requestRepairForm =
  document.getElementById("request-repair-form");

requestRepairForm.addEventListener("submit", async (event) => {
    const requestSubmitButton = document.getElementById("request-submit-btn");
    const categoryContainer = document.getElementById("category");
    const titleInput = document.getElementById("title");
    const descriptionInput = document.getElementById("description");
    const locationInput = document.getElementById("location");

    event.preventDefault();

    requestSubmitButton.disabled =
      true;

    requestSubmitButton.textContent =
      "Submitting...";


    try {
      let photoUrls = [];

      // Upload photos only when photos exist
      if (
        selectedPhotos.length > 0
      ) {

        requestSubmitButton.textContent =
          "Uploading photos...";


        photoUrls =
          await uploadAllPhotos();

      }

      requestSubmitButton.textContent =
        "Creating request...";
      

       const requestData = {
          category_id: Number(categoryContainer.value),
          title: titleInput.value.trim(),
          description: descriptionInput.value.trim(),
          location: locationInput.value.trim(),
          photos: photoUrls
        };

      // Send JSON to RepairHub backend
      const response = await createRepairRequest(requestData);


      alert(
        "Repair request submitted successfully."
      );

      requestRepairForm.reset();

      // Empty selected photos
      selectedPhotos.length = 0;


      // Remove photo previews
      photoPreviewContainer
        .querySelectorAll(
          ".remove-photo-btn"
        )
        .forEach((button) => {

          button
            .parentElement
            .remove();

        });


      // Redirect
      
      const requestId = response.request.id;

      window.location.href =
        `/pages/customer/repair-details.html?id=${requestId}`;
      


    } catch (error) {

      console.error(error);


      alert(
        error.message ||
        "Unable to submit repair request."
      );


    } finally {

      requestSubmitButton.disabled =
        false;

      requestSubmitButton.textContent =
        "Post repair request";

    }

  }
);