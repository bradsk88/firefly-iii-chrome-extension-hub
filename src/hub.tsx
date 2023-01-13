import React from "react";
import { createRoot } from "react-dom/client";
import Hub from "./components/Hub";
import Initialize from "./components/Initialize";

window.onload = () => {
  const domContainer = document.getElementById("root") as HTMLElement;
  const root = createRoot(domContainer);
  root.render('loading');

  chrome.runtime.sendMessage({
    action: 'check_logged_in',
  }).then(
      loggedIn => {
        if (loggedIn) {
          root.render(
              <Hub />
          );
        } else {
          root.render(
              <Initialize />
          )
        }
      }
  )

};
