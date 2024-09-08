import React from "react";
import {
    fitCroppedImageToTemplates,
    saveAndDownloadImages,
    uploadFittedImages,
    createEtsyDraftListing,
} from "./util.js";

export const CircularCrop = () => {
    const [image, setImage] = React.useState(null);
    const [crop, setCrop] = React.useState({ x: 0, y: 0 });
    const [zoom, setZoom] = React.useState(1);
    const [isDragging, setIsDragging] = React.useState(false);
    const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
    const [fittedImages, setFittedImages] = React.useState([]);
    const canvasRef = React.useRef(null);
    const previewCanvasRef = React.useRef(null);
    const [croppedImageBlob, setCroppedImageBlob] = React.useState(null);
    const [description, setDescription] = React.useState("");
    const [apiKey, setApiKey] = React.useState(
        () => localStorage.getItem("etsyApiKey") || ""
    );

    React.useEffect(() => {
        if (image) {
            drawImage();
            updatePreview();
        }
    }, [image, crop, zoom]);

    React.useEffect(() => {
        localStorage.setItem("etsyApiKey", apiKey);
    }, [apiKey]);

    const handleDescriptionChange = (e) => {
        setDescription(e.target.value);
    };

    const handleApiKeyChange = (e) => {
        setApiKey(e.target.value);
    };

    const onSelectFile = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    setImage(img);
                    setCrop({ x: 0, y: 0 });
                    setZoom(1);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const updatePreview = () => {
        const previewCanvas = previewCanvasRef.current;
        const ctx = previewCanvas.getContext("2d");
        const cropSize = Math.min(image.naturalWidth, image.naturalHeight);

        ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

        ctx.save();
        ctx.beginPath();
        ctx.arc(
            previewCanvas.width / 2,
            previewCanvas.height / 2,
            previewCanvas.width / 2,
            0,
            Math.PI * 2
        );
        ctx.clip();

        const scale = cropSize / canvasRef.current.width;
        const zoomedScale = scale * zoom;
        const sourceX =
            image.naturalWidth / 2 - cropSize / (2 * zoom) - crop.x * scale;
        const sourceY =
            image.naturalHeight / 2 - cropSize / (2 * zoom) - crop.y * scale;
        const sourceSize = cropSize / zoom;

        ctx.drawImage(
            image,
            sourceX,
            sourceY,
            sourceSize,
            sourceSize,
            0,
            0,
            previewCanvas.width,
            previewCanvas.height
        );

        ctx.restore();
    };

    const drawImage = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = canvas.width / 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate the scale to fit the entire image within the canvas
        const scale = Math.min(
            canvas.width / image.naturalWidth,
            canvas.height / image.naturalHeight
        );

        // Apply zoom
        const zoomedScale = scale * zoom;

        // Calculate dimensions of the zoomed image
        const zoomedWidth = image.naturalWidth * zoomedScale;
        const zoomedHeight = image.naturalHeight * zoomedScale;

        const x = centerX - zoomedWidth / 2 + crop.x * zoomedScale;
        const y = centerY - zoomedHeight / 2 + crop.y * zoomedScale;

        // Draw the full image (for context) with reduced opacity
        ctx.globalAlpha = 0.3;
        ctx.drawImage(image, x, y, zoomedWidth, zoomedHeight);
        ctx.globalAlpha = 1.0;

        // Draw circular crop area
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.clip();

        // Calculate the crop area
        const cropSize = canvas.width;
        const sourceX = (-x + centerX - radius) / zoomedScale;
        const sourceY = (-y + centerY - radius) / zoomedScale;
        const sourceSize = cropSize / zoomedScale;

        // Draw only the cropped part of the image
        ctx.drawImage(
            image,
            sourceX,
            sourceY,
            sourceSize,
            sourceSize,
            centerX - radius,
            centerY - radius,
            cropSize,
            cropSize
        );

        ctx.restore();

        // Draw crop circle outline
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
    };
    // ... rest of the existing code ...
    const handleMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setIsDragging(true);
        setDragStart({ x: x - crop.x, y: y - crop.y });
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setCrop({
                x: x - dragStart.x,
                y: y - dragStart.y,
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleZoomChange = (e) => {
        setZoom(parseFloat(e.target.value));
    };

    // ... existing code ...

    const downloadCroppedImage = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const cropSize = Math.min(image.naturalWidth, image.naturalHeight);
        canvas.width = cropSize;
        canvas.height = cropSize;

        // Create circular clipping path
        ctx.beginPath();
        ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2);
        ctx.clip();

        // Calculate the crop area in the original image coordinates
        const scale = cropSize / (canvasRef.current.width / zoom);
        const sourceX =
            image.naturalWidth / 2 -
            cropSize / (2 * zoom) -
            (crop.x * scale) / zoom;
        const sourceY =
            image.naturalHeight / 2 -
            cropSize / (2 * zoom) -
            (crop.y * scale) / zoom;
        const sourceSize = cropSize / zoom;

        // Draw the cropped image at full resolution
        ctx.drawImage(
            image,
            sourceX,
            sourceY,
            sourceSize,
            sourceSize,
            0,
            0,
            cropSize,
            cropSize
        );

        // Create download link
        canvas.toBlob(
            (blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.download = "cropped-image.png";
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
            },
            "image/png",
            1
        ); // Use maximum quality for PNG
    };

    const processCroppedImage = async () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const cropSize = Math.min(image.naturalWidth, image.naturalHeight);
        canvas.width = cropSize;
        canvas.height = cropSize;

        // Create circular clipping path
        ctx.beginPath();
        ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2);
        ctx.clip();

        // Update these calculations
        const scale = cropSize / canvasRef.current.width;
        const zoomedScale = scale * zoom;
        const sourceX =
            image.naturalWidth / 2 - cropSize / (2 * zoom) - crop.x * scale;
        const sourceY =
            image.naturalHeight / 2 - cropSize / (2 * zoom) - crop.y * scale;
        const sourceSize = cropSize / zoom;

        // Draw the cropped image at full resolution
        ctx.drawImage(
            image,
            sourceX,
            sourceY,
            sourceSize,
            sourceSize,
            0,
            0,
            cropSize,
            cropSize
        );

        // Get the cropped image as a blob
        const croppedImageBlob = await new Promise((resolve) =>
            canvas.toBlob(resolve, "image/png", 1)
        );

        setCroppedImageBlob(croppedImageBlob);

        // Use the utility function to fit the cropped image to all templates
        const results = await fitCroppedImageToTemplates(croppedImageBlob);
        setFittedImages(results);
    };

    const handleSaveDownloadAndSubmit = async () => {
        if (croppedImageBlob && fittedImages.length > 0) {
            const zip = await saveAndDownloadImages(
                croppedImageBlob,
                fittedImages
            );

            const url = URL.createObjectURL(zip);
            const link = document.createElement("a");
            link.download = "processed_images.zip";
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);

            try {
                const draftListing = await createEtsyDraftListing(
                    apiKey,
                    description
                );
                const listingId = draftListing.listing_id;

                await uploadFittedImages(listingId, fittedImages, apiKey);

                alert(
                    "Draft listing created and images uploaded successfully!"
                );
            } catch (error) {
                console.error(
                    "Error creating draft listing or uploading images:",
                    error
                );
                alert(
                    "Error creating draft listing or uploading images. Please check your API key and try again."
                );
            }
        }
    };

    const handleSaveDownloadAndCreateListing = async () => {
        if (croppedImageBlob && fittedImages.length > 0) {
            // Save and download images
            const zip = await saveAndDownloadImages(
                croppedImageBlob,
                fittedImages
            );

            const url = URL.createObjectURL(zip);
            const link = document.createElement("a");
            link.download = "processed_images.zip";
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);

            // Create Etsy draft listing
            try {
                const draftListing = await createEtsyDraftListing(
                    apiKey,
                    description
                );
                const listingId = draftListing.listing_id;

                // Upload images to Etsy
                for (const fittedImage of fittedImages) {
                    await uploadImagesToEtsy(
                        apiKey,
                        listingId,
                        fittedImage.resultImage
                    );
                }

                alert(
                    "Draft listing created and images uploaded successfully!"
                );
            } catch (error) {
                console.error(
                    "Error creating draft listing or uploading images:",
                    error
                );
                alert(
                    "Error creating draft listing or uploading images. Please check your API key and try again."
                );
            }
        }
    };

    // ... existing code ...

    return React.createElement(
        "div",
        {
            className:
                "flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4",
        },
        React.createElement("input", {
            type: "file",
            accept: "image/*",
            onChange: onSelectFile,
            className: "mb-4",
        }),
        React.createElement("textarea", {
            value: description,
            onChange: handleDescriptionChange,
            placeholder: "Enter description header",
            className: "w-full p-2 mb-4 border rounded",
            rows: 3,
        }),
        React.createElement("input", {
            type: "text",
            value: apiKey,
            onChange: handleApiKeyChange,
            placeholder: "Enter Etsy API Key",
            className: "w-full p-2 mb-4 border rounded",
        }),
        image &&
            React.createElement(
                "div",
                { className: "flex flex-col items-center" },
                React.createElement("canvas", {
                    ref: canvasRef,
                    width: 300,
                    height: 300,
                    className:
                        "border-4 border-white rounded-full shadow-lg cursor-move mb-4",
                    onMouseDown: handleMouseDown,
                    onMouseMove: handleMouseMove,
                    onMouseUp: handleMouseUp,
                    onMouseLeave: handleMouseUp,
                }),

                React.createElement("canvas", {
                    ref: previewCanvasRef,
                    width: 150,
                    height: 150,
                    className:
                        "border-4 border-white rounded-full shadow-lg mb-4",
                }),
                React.createElement(
                    "div",
                    { className: "w-64 mb-4" },
                    React.createElement("input", {
                        type: "range",
                        min: "0.1",
                        max: "3",
                        step: "0.1",
                        value: zoom,
                        onChange: handleZoomChange,
                        className: "w-full",
                    })
                ),
                React.createElement(
                    "button",
                    {
                        onClick: processCroppedImage,
                        className:
                            "bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300 mb-4",
                    },
                    "Process Cropped Image"
                ),
                fittedImages.length > 0
                    ? React.createElement(
                          "button",
                          {
                              onClick: handleSaveDownloadAndCreateListing,
                              className:
                                  "bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300 mb-4",
                          },
                          "Save, Download, and Create Etsy Draft Listing"
                      )
                    : null,
                fittedImages.length > 0
                    ? React.createElement(
                          "div",
                          { className: "grid grid-cols-3 gap-4 mt-4" },
                          fittedImages.map((result, index) =>
                              React.createElement(
                                  "div",
                                  {
                                      key: index,
                                      className: "flex flex-col items-center",
                                  },
                                  React.createElement("img", {
                                      src: URL.createObjectURL(
                                          result.resultImage
                                      ),
                                      alt: `Fitted image ${index + 1}`,
                                      className: "w-full h-auto mb-2",
                                  }),
                                  React.createElement(
                                      "p",
                                      { className: "text-sm text-gray-600" },
                                      `Template ID: ${result.templateId}`
                                  )
                              )
                          )
                      )
                    : null
            )
    );
};
