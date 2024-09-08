import React from "react";
import ReactDOM from "react-dom/client";
import { TemplateCreator } from "./TemplateCreator.js";
import { CircularCrop } from "./CircularCrop.js";
import PersistentForm from "./draftPage.js";

const App = () => {
    const [page, setPage] = React.useState("templates");

    const navButton = (text, targetPage) =>
        React.createElement(
            "button",
            {
                onClick: () => setPage(targetPage),
                className: `px-4 py-2 ${
                    page === targetPage
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200"
                } rounded mr-2`,
            },
            text
        );

    return React.createElement(
        "div",
        { className: "container mx-auto p-4" },
        React.createElement(
            "nav",
            { className: "mb-4" },
            navButton("Create Templates", "templates"),
            navButton("Insert Image", "insert"),
            navButton("Persistent Form", "persistent")
        ),
        page === "templates"
            ? React.createElement(TemplateCreator)
            : page === "insert"
            ? React.createElement(CircularCrop)
            : React.createElement(PersistentForm)
    );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
