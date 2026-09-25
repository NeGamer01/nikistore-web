"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const sidebar = document.querySelector(".admin-sidebar") as HTMLElement;
    if (sidebar && isMobile) {
      sidebar.style.transition = "transform 0.3s ease";
      sidebar.style.transform = isOpen ? "translateX(0)" : "translateX(-100%)";
    }
  }, [isOpen, isMobile]);

  useEffect(() => {
    const sidebar = document.querySelector(".admin-sidebar") as HTMLElement;
    if (sidebar && isMobile && !isOpen) {
      sidebar.style.transform = "translateX(-100%)";
    }
  }, [isMobile]);

  if (!isMobile) return null;

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          top: "1rem",
          left: "1rem",
          zIndex: 50,
          padding: "0.75rem",
          background: "#6366f1",
          border: "none",
          borderRadius: "0.5rem",
          color: "#fff",
          cursor: "pointer",
          boxShadow: "0 4px 6px rgba(0,0,0,0.3)"
        }}
      >
        <Menu size={24} />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            zIndex: 35
          }}
        />
      )}

      {/* Close button */}
      {isOpen && (
        <button
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            top: "1rem",
            right: "1rem",
            zIndex: 45,
            padding: "0.75rem",
            background: "#ef4444",
            border: "none",
            borderRadius: "0.5rem",
            color: "#fff",
            cursor: "pointer",
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)"
          }}
        >
          <X size={24} />
        </button>
      )}
    </>
  );
}
