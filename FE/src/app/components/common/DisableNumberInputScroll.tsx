"use client";

import { useEffect } from "react";

export const DisableNumberInputScroll = () => {
  useEffect(() => {
    let activeNumberInput: HTMLInputElement | null = null;

    const blockWheelOnNumberInput = (event: WheelEvent) => {
      event.preventDefault();
      activeNumberInput?.blur();
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (target.type !== "number") return;

      if (activeNumberInput && activeNumberInput !== target) {
        activeNumberInput.removeEventListener("wheel", blockWheelOnNumberInput);
      }

      activeNumberInput = target;
      // Non-passive here is intentional: preventDefault is required to block value stepping.
      activeNumberInput.addEventListener("wheel", blockWheelOnNumberInput, { passive: false });
    };

    const handleFocusOut = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (target.type !== "number") return;

      target.removeEventListener("wheel", blockWheelOnNumberInput);
      if (activeNumberInput === target) {
        activeNumberInput = null;
      }
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      if (activeNumberInput) {
        activeNumberInput.removeEventListener("wheel", blockWheelOnNumberInput);
      }
    };
  }, []);

  return null;
};
