"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";

export default function BackButtonHandler() {
  useEffect(() => {
    // 1. Define the listener logic
    const setupListener = async () => {
      try {
        await App.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            // No more history? Close the school app.
            App.exitApp();
          }
        });
      } catch (e) {
        console.log("Capacitor App plugin not available in browser.");
      }
    };

    setupListener();

    // 2. Clean up when the component unmounts
    return () => {
      App.removeAllListeners();
    };
  }, []);

  return null;
}