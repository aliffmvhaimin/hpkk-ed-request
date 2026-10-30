"use client";

import { useLayoutEffect, useRef, useState, type HTMLAttributes } from "react";

type Props = Omit<HTMLAttributes<HTMLDivElement>, "children" | "onInput"> & {
  value: string;
  onValueChange: (value: string) => void;
};

export function RemarkInput({ value, onValueChange, ...props }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [initialValue] = useState(value);

  useLayoutEffect(() => {
    // The browser already updated the text during input. Replacing it again
    // resets the caret; only write when Cancel or fresh server data changes it.
    if (ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
  }, [value]);

  return <div {...props} ref={ref} suppressContentEditableWarning
    onInput={event => onValueChange(event.currentTarget.textContent ?? "")}
  >{initialValue}</div>;
}
