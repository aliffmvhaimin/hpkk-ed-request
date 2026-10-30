"use client";

import { useEffect } from "react";

export function useUnsavedRequestChanges(dirty: boolean, pending: boolean) {
  useEffect(() => {
    if (!dirty && !pending) return;
    const confirmDiscard = (event: Event, message: string) => {
      if (event.defaultPrevented) return;
      if (pending || !confirm(message)) event.preventDefault();
    };
    const unload = (event: BeforeUnloadEvent) => event.preventDefault();
    const click = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest("a")) {
        confirmDiscard(event, "Discard unsaved request changes?");
      }
    };
    const submit = (event: SubmitEvent) => confirmDiscard(event, "Discard unsaved request changes and sign out?");
    const week = (event: Event) => confirmDiscard(event, "Discard unsaved request changes and change week?");
    window.addEventListener("beforeunload", unload);
    window.addEventListener("request-week-change", week);
    document.addEventListener("click", click, true);
    document.addEventListener("submit", submit, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      window.removeEventListener("request-week-change", week);
      document.removeEventListener("click", click, true);
      document.removeEventListener("submit", submit, true);
    };
  }, [dirty, pending]);
}
