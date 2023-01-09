import React from "react";
import { createRoot } from "react-dom/client";
import Initialize from "./components/Initialize";

window.onload = () => {
  const domContainer = document.getElementById("root") as HTMLElement;
  const root = createRoot(domContainer);
  root.render(
    <Initialize />
  );
};
