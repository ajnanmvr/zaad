"use client";

import { useCallback, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const IDLE_LIMIT_MS = 10 * 60 * 1000; // 10 minutes of inactivity
const CHECK_INTERVAL_MS = 15 * 1000;
const WRITE_THROTTLE_MS = 2000;
const ACTIVITY_KEY = "zaad:last-activity";
const LOGOUT_KEY = "zaad:idle-logout";

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "wheel",
] as const;

export default function IdleLogout() {
  const lastActivityRef = useRef(Date.now());
  const lastWriteRef = useRef(0);
  const loggingOutRef = useRef(false);

  const markActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    if (now - lastWriteRef.current > WRITE_THROTTLE_MS) {
      lastWriteRef.current = now;
      try {
        localStorage.setItem(ACTIVITY_KEY, String(now));
      } catch {
        // storage may be unavailable — in-memory timer still works
      }
    }
  }, []);

  const performLogout = useCallback(async () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;

    try {
      localStorage.setItem(LOGOUT_KEY, String(Date.now()));
    } catch {
      // ignore
    }

    try {
      await axios.get("/api/users/auth/logout");
    } catch {
      // redirect regardless of the network result
    }

    toast.error("Signed out after 10 minutes of inactivity");
    window.location.href = "/login";
  }, []);

  useEffect(() => {
    try {
      localStorage.removeItem(LOGOUT_KEY);
      const stored = Number(localStorage.getItem(ACTIVITY_KEY) || 0);
      if (stored > lastActivityRef.current) {
        lastActivityRef.current = stored;
      }
    } catch {
      // ignore
    }

    markActivity();

    const onActivity = () => markActivity();
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, onActivity, { passive: true }),
    );

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        markActivity();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onStorage = (event: StorageEvent) => {
      if (event.key === ACTIVITY_KEY && event.newValue) {
        const value = Number(event.newValue);
        if (value > lastActivityRef.current) {
          lastActivityRef.current = value;
        }
      }
      if (event.key === LOGOUT_KEY && event.newValue && !loggingOutRef.current) {
        loggingOutRef.current = true;
        window.location.href = "/login";
      }
    };
    window.addEventListener("storage", onStorage);

    const interval = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current >= IDLE_LIMIT_MS) {
        void performLogout();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, onActivity),
      );
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
      window.clearInterval(interval);
    };
  }, [markActivity, performLogout]);

  return null;
}
