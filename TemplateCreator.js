import React from "react";
import { openDB } from "idb";

export const TemplateCreator = () => {
    const [templates, setTemplates] = React.useState([]);
    const canvasRef = React.useRef(null);
    const [isDrawing, setIsDrawing] = React.useState(false);
    const [circle, setCircle] = React.useState(null);
    const [uploadedImage, setUploadedImage] = React.useState(null);
    const [canvasSize, setCanvasSize] = React.useState({
        width: 300,
        height: 300,
    });
    const [uploadedFile, setUploadedFile] = React.useState(null);
    const [previewCircle, setPreviewCircle] = React.useState(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [isResizing, setIsResizing] = React.useState(false);

    React.useEffect(() => {
        loadTemplates();
    }, []);

    React.useEffect(() => {
        if (uploadedImage) {
            drawUploadedImage();
        }
    }, [uploadedImage]);

    const loadTemplates = async () => {
        const db = await openDB("ImageTemplateDB", 2, {
            upgrade(db) {
                db.createObjectStore("templates", {
                    keyPath: "id",
                    autoIncrement: true,
                });
            },
        });
        const templates = await db.getAll("templates");
        setTemplates(templates);
    };

    const handleCanvasMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (previewCircle) {
            const distanceFromCenter = Math.sqrt(
                Math.pow(x - previewCircle.x, 2) +
                    Math.pow(y - previewCircle.y, 2)
            );
            if (Math.abs(distanceFromCenter - previewCircle.radius) < 10) {
                setIsResizing(true);
            } else if (distanceFromCenter < previewCircle.radius) {
                setIsDragging(true);
            } else {
                setPreviewCircle({ x, y, radius: 50 });
            }
        } else {
            setPreviewCircle({ x, y, radius: 50 });
        }
    };

    const handleCanvasMouseMove = (e) => {
        if (!previewCircle) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (isDragging) {
            setPreviewCircle({ ...previewCircle, x, y });
        } else if (isResizing) {
            const dx = x - previewCircle.x;
            const dy = y - previewCircle.y;
            const newRadius = Math.sqrt(dx * dx + dy * dy);
            setPreviewCircle({ ...previewCircle, radius: newRadius });
        }

        drawCircle();
    };

    const handleCanvasMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
    };

    const drawCircle = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (uploadedImage) {
            drawUploadedImage();
        }
        if (previewCircle) {
            ctx.beginPath();
            ctx.arc(
                previewCircle.x,
                previewCircle.y,
                previewCircle.radius,
                0,
                Math.PI * 2
            );
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    };

    const drawUploadedImage = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(uploadedImage, 0, 0, canvas.width, canvas.height);
    };

    const saveTemplate = async () => {
        if (!uploadedFile || !previewCircle) return;

        const canvas = canvasRef.current;
        const aspectRatio = canvas.width / canvas.height;
        const db = await openDB("ImageTemplateDB", 2);
        await db.add("templates", {
            originalImage: uploadedFile,
            circle: {
                x: previewCircle.x / canvas.width,
                y: previewCircle.y / canvas.height,
                radius: previewCircle.radius / canvas.width,
            },
            aspectRatio,
            originalWidth: uploadedImage.naturalWidth,
            originalHeight: uploadedImage.naturalHeight,
        });
        loadTemplates();
        setPreviewCircle(null);
        drawUploadedImage();
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        setUploadedFile(file);
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const maxSize = 1000;
                const scale = Math.min(
                    1,
                    maxSize / Math.max(img.width, img.height)
                );
                setCanvasSize({
                    width: img.width * scale,
                    height: img.height * scale,
                });
                setUploadedImage(img);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const deleteTemplate = async (id) => {
        const db = await openDB("ImageTemplateDB", 2);
        await db.delete("templates", id);
        loadTemplates();
    };

    return React.createElement(
        "div",
        null,
        React.createElement(
            "h2",
            { className: "text-2xl font-bold mb-4" },
            "Create Template"
        ),
        React.createElement("input", {
            type: "file",
            accept: "image/*",
            onChange: handleFileUpload,
            className: "mb-4",
        }),
        React.createElement("canvas", {
            ref: canvasRef,
            width: canvasSize.width,
            height: canvasSize.height,
            className: "border-2 border-gray-300 cursor-crosshair mb-4",
            onMouseDown: handleCanvasMouseDown,
            onMouseMove: handleCanvasMouseMove,
            onMouseUp: handleCanvasMouseUp,
            onMouseLeave: handleCanvasMouseUp,
        }),
        React.createElement(
            "button",
            {
                onClick: saveTemplate,
                className: "bg-blue-500 text-white px-4 py-2 rounded mb-4",
                disabled: !previewCircle,
            },
            "Save Template"
        ),
        React.createElement(
            "h3",
            { className: "text-xl font-semibold mb-2" },
            "Saved Templates"
        ),
        React.createElement(
            "div",
            { className: "grid grid-cols-3 gap-4" },
            templates.map((template) =>
                React.createElement(
                    "div",
                    { key: template.id, className: "relative" },
                    React.createElement("img", {
                        src: URL.createObjectURL(template.originalImage),
                        className: "w-full border border-gray-300",
                        onLoad: (e) => URL.revokeObjectURL(e.target.src),
                    }),
                    React.createElement("div", {
                        className:
                            "absolute border-2 border-red-500 rounded-full",
                        style: {
                            left: `${template.circle.x * 100}%`,
                            top: `${template.circle.y * 100}%`,
                            width: `${template.circle.radius * 200}%`,
                            height: `${
                                template.circle.radius *
                                200 *
                                template.aspectRatio
                            }%`,
                            transform: "translate(-50%, -50%)",
                        },
                    }),
                    React.createElement(
                        "button",
                        {
                            onClick: () => deleteTemplate(template.id),
                            className:
                                "absolute top-0 right-0 bg-red-500 text-white p-1 text-xs",
                        },
                        "Delete"
                    )
                )
            )
        )
    );
};
