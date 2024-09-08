import React, { useState, useEffect } from "react";
import DraftListingForm from "./draftForm.js";
import { getDraftListingFormData, saveDraftListingFormData } from "./util.js";

const PersistentForm = () => {
    const [formData, setFormData] = useState(null);

    useEffect(() => {
        const loadFormData = async () => {
            try {
                const data = await getDraftListingFormData("currentDraft");
                if (data) setFormData(data);
                console.log("Form data loaded:", data);
            } catch (error) {
                console.error("Error loading form data:", error);
            }
        };

        loadFormData();
    }, []);

    const handleSave = async (data) => {
        try {
            await saveDraftListingFormData("currentDraft", data);
            setFormData(data);
            console.log("Form data saved:", data);
        } catch (error) {
            console.error("Error saving form data:", error);
        }
    };

    return React.createElement(
        "div",
        null,
        React.createElement(
            "h2",
            { className: "text-2xl font-bold mb-4" },
            "Persistent Draft Listing Form"
        ),
        React.createElement(DraftListingForm, {
            onSave: handleSave,
            initialData: formData,
        }),
        formData &&
            React.createElement(
                "div",
                { className: "mt-4" },
                React.createElement(
                    "h3",
                    { className: "text-xl font-semibold mb-2" },
                    "Saved Form Data:"
                ),
                React.createElement(
                    "pre",
                    { className: "bg-gray-100 p-4 rounded" },
                    JSON.stringify(formData, null, 2)
                )
            )
    );
};

export default PersistentForm;
