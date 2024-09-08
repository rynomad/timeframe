import { openDB } from "idb";

import draftSchema from "./draftSchema.js";
// ... existing code ...

import JSZip from "jszip";
import filesaver from "file-saver";
const { saveAs } = filesaver;
// ... existing code ...

export async function saveAndDownloadImages(croppedImageBlob, fittedImages) {
    // Open the database
    const db = await openDB("ImageTemplateDB", 2, {
        upgrade(db) {
            if (!db.objectStoreNames.contains("processedImages")) {
                db.createObjectStore("processedImages", {
                    keyPath: "id",
                    autoIncrement: true,
                });
            }
        },
    });
    // Create a new ZIP file
    const zip = new JSZip();

    // Add the original cropped image to the ZIP and database
    zip.file("original_crop.png", croppedImageBlob);

    // Add each fitted image to the ZIP and database
    for (let i = 0; i < fittedImages.length; i++) {
        const { templateId, resultImage } = fittedImages[i];
        const fileName = `fitted_image_${templateId}.png`;
        zip.file(fileName, resultImage);
    }

    // Generate the ZIP file
    const zipBlob = await zip.generateAsync({ type: "blob" });

    // Save the ZIP file
    saveAs(zipBlob, "processed_images.zip");

    // Close the transaction
    // await tx.done;

    return zipBlob;
}

// ... existing imports and code ...

export async function fitCroppedImageToTemplates(croppedImageBlob) {
    const db = await openDB("ImageTemplateDB", 2);
    const templates = await db.getAll("templates");
    const croppedImage = await createImageFromBlob(croppedImageBlob);

    const results = await Promise.all(
        templates.map(async (template) => {
            const templateImage = await createImageFromFile(
                template.originalImage
            );

            // Create a canvas with the template's original dimensions
            const canvas = document.createElement("canvas");
            canvas.width = templateImage.width;
            canvas.height = templateImage.height;
            const ctx = canvas.getContext("2d");

            // Draw the template image
            ctx.drawImage(templateImage, 0, 0);

            // Calculate the dimensions of the template's circle
            const circleX = template.circle.x * templateImage.width;
            const circleY = template.circle.y * templateImage.height;
            const circleRadius = template.circle.radius * templateImage.width;

            // Create a circular clipping path
            ctx.save();
            ctx.beginPath();
            ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
            ctx.clip();

            // Calculate the scale to fit the entire cropped image into the circle
            const scale =
                (circleRadius * 2) /
                Math.min(croppedImage.width, croppedImage.height);

            // Calculate the dimensions of the scaled cropped image
            const scaledWidth = croppedImage.width * scale;
            const scaledHeight = croppedImage.height * scale;

            // Calculate the position to center the cropped image in the circle
            const x = circleX - scaledWidth / 2;
            const y = circleY - scaledHeight / 2;

            // Draw the cropped image
            ctx.drawImage(croppedImage, x, y, scaledWidth, scaledHeight);

            ctx.restore();

            // Convert the canvas to a blob
            const resultBlob = await new Promise((resolve) =>
                canvas.toBlob(resolve, "image/png")
            );

            return {
                templateId: template.id,
                resultImage: resultBlob,
            };
        })
    );

    return results;
}

// ... rest of the existing code ...

// Helper function to create an Image from a Blob
function createImageFromBlob(blob) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(blob);
    });
}

// Helper function to create an Image from a File object
function createImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(img.src); // Clean up the object URL
            resolve(img);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

// ... existing code ...
export async function uploadFittedImages(listingId, fittedImages, authToken) {
    const uploadResults = [];

    // Get the draft object from IndexedDB
    const draftData = await getDraftListingFormData("currentDraft");
    const shopId = draftData.shop_id;

    if (!shopId) {
        throw new Error("Shop ID not found in draft data");
    }

    for (const fittedImage of fittedImages) {
        try {
            const formData = new FormData();
            formData.append(
                "image",
                fittedImage.resultImage,
                `fitted_image_${fittedImage.templateId}.png`
            );

            const response = await fetch(
                `https://openapi.etsy.com/v3/application/shops/${shopId}/listings/${listingId}/images`,
                {
                    method: "POST",
                    body: formData,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            uploadResults.push({
                templateId: fittedImage.templateId,
                success: true,
                imageId: result.listing_image_id,
            });
        } catch (error) {
            console.error(
                `Error uploading image for template ${fittedImage.templateId}:`,
                error
            );
            uploadResults.push({
                templateId: fittedImage.templateId,
                success: false,
                error: error.message,
            });
        }
    }

    return uploadResults;
}

// ... existing code ...

const DB_NAME = "DraftListingDB";
const STORE_NAME = "formData";

const openDraftListingDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore(STORE_NAME);
        };
    });
};

export const getDraftListingFormData = async (key) => {
    const db = await openDraftListingDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const saveDraftListingFormData = async (key, data) => {
    const db = await openDraftListingDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(data, key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export async function createEtsyDraftListing(token, descriptionHeader) {
    const baseDraft = await getDraftListingFormData("currentDraft");
    // Combine the description header with the existing description
    const updatedDescription = `${descriptionHeader}\n\n${
        baseDraft.description || ""
    }`;

    // Create a new object with the updated description
    const draftData = {
        ...baseDraft,
        description: updatedDescription,
    };

    // Extract shop_id from the draft data
    const shopId = draftData.shop_id;
    if (!shopId) {
        throw new Error("shop_id is required");
    }

    // Remove shop_id from draftData as it's a path parameter, not a body parameter
    delete draftData.shop_id;

    // Prepare the request body
    const formData = new URLSearchParams();

    // Add all required fields from the schema
    draftSchema.schemas.post.requestBody.content[
        "application/x-www-form-urlencoded"
    ].schema.required.forEach((field) => {
        if (draftData[field] !== undefined) {
            if (Array.isArray(draftData[field])) {
                draftData[field].forEach((value) =>
                    formData.append(`${field}[]`, value)
                );
            } else {
                formData.append(field, draftData[field]);
            }
        }
    });

    // Add optional fields if they exist in the draftData
    Object.keys(draftData).forEach((key) => {
        if (!formData.has(key) && draftData[key] !== undefined) {
            if (Array.isArray(draftData[key])) {
                draftData[key].forEach((value) =>
                    formData.append(`${key}[]`, value)
                );
            } else {
                formData.append(key, draftData[key]);
            }
        }
    });

    try {
        const response = await fetch(
            `https://openapi.etsy.com/v3/application/shops/${shopId}/listings`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Error creating draft listing:", error);
        throw error;
    }
}
