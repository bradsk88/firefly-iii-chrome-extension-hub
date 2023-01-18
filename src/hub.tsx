import React from "react";
import {createRoot} from "react-dom/client";
import HubWrapper from "./components/HubWrapper";

window.onload = () => {
    const domContainer = document.getElementById("root") as HTMLElement;
    const root = createRoot(domContainer);
    root.render(<HubWrapper/>);
};
