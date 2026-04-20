/*
 * File Overview:
 * Use Case: Main app routes ke liye shared spacing/layout wrapper deta hai.
 * Project Role: Authenticated route group ka consistent viewport structure maintain karta hai.
 * Trigger: (main) route group ke kisi bhi page par.
 * File Path: app/(main)/layout.jsx
 */
import React from "react";

const layout = ({ children }) => {
  return <div className="mt-16">{children}</div>;
};

export default layout;
