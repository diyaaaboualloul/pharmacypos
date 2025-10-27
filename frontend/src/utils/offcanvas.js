// src/utils/offcanvas.js
import { Offcanvas } from "bootstrap";

/**
 * Hide a Bootstrap offcanvas element safely.
 * Creates an instance if one doesn’t already exist.
 */
export function hideOffcanvasById(id = "sidebarMenu") {
  const el = document.getElementById(id);
  if (!el) return;
  const inst = Offcanvas.getInstance(el) || new Offcanvas(el);
  inst.hide();
}
