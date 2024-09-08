import React from "react";
import { withTheme } from "@rjsf/core";
import { Theme as Bootstrap5Theme } from "@rjsf/bootstrap-5";
import validator from "@rjsf/validator-ajv8";
import draftSchema from "./draftSchema.js";

const Form = withTheme(Bootstrap5Theme);

const DraftListingForm = ({ onSave, initialData }) => {
    const schema = {
        type: "object",
        properties: {
            shop_id: draftSchema.schemas.post.parameters[0].schema,
            ...draftSchema.schemas.post.requestBody.content[
                "application/x-www-form-urlencoded"
            ].schema.properties,
        },
        required: [
            "shop_id",
            ...draftSchema.schemas.post.requestBody.content[
                "application/x-www-form-urlencoded"
            ].schema.required,
        ],
    };

    const uiSchema = {
        "ui:submitButtonOptions": {
            submitText: "Create Draft Listing",
        },
        shop_id: {
            "ui:widget": "updown",
        },
        quantity: {
            "ui:widget": "updown",
        },
        price: {
            "ui:widget": "updown",
        },
        description: {
            "ui:widget": "textarea",
        },
        materials: {
            "ui:options": {
                addable: true,
                orderable: true,
                removable: true,
            },
        },
        tags: {
            "ui:options": {
                addable: true,
                orderable: true,
                removable: true,
            },
        },
        styles: {
            "ui:options": {
                addable: true,
                orderable: true,
                removable: true,
            },
        },
        production_partner_ids: {
            "ui:options": {
                addable: true,
                orderable: true,
                removable: true,
            },
        },
        image_ids: {
            "ui:options": {
                addable: true,
                orderable: true,
                removable: true,
            },
        },
    };

    const handleSubmit = ({ formData }) => {
        onSave(formData);
    };

    return React.createElement(Form, {
        schema: schema,
        uiSchema: uiSchema,
        validator: validator,
        onSubmit: handleSubmit,
        formData: initialData,
    });
};

export default DraftListingForm;
