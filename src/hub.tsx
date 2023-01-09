import React from "react";
import { createRoot } from "react-dom/client";
import Hub from "./components/Hub";

window.onload = () => {
  const domContainer = document.getElementById("root") as HTMLElement;
  const root = createRoot(domContainer);
  root.render(
    <Hub />
  );
};
