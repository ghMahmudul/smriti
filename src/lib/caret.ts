export interface CaretCoordinates {
  top: number;
  left: number;
  height: number;
}

const mirrorProperties = [
  "direction",
  "boxSizing",
  "width",
  "height",
  "overflowX",
  "overflowY",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderStyle",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontStretch",
  "fontSize",
  "fontSizeAdjust",
  "lineHeight",
  "fontFamily",
  "textAlign",
  "textTransform",
  "textIndent",
  "textDecoration",
  "letterSpacing",
  "wordSpacing",
  "tabSize",
] as const;

export function getCaretCoordinates(
  element: HTMLTextAreaElement | HTMLInputElement,
  position: number,
): CaretCoordinates {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return { top: 0, left: 0, height: 24 };
  }

  const isInput = element.nodeName === "INPUT";
  const div = document.createElement("div");
  div.id = "caret-position-mirror-div";
  document.body.appendChild(div);

  try {
    const style = div.style;
    const computed = window.getComputedStyle(element);

    style.whiteSpace = isInput ? "nowrap" : "pre-wrap";
    if (!isInput) {
      style.wordWrap = "break-word";
    }
    style.position = "absolute";
    style.visibility = "hidden";
    style.top = "0";
    style.left = "-9999px";
    style.pointerEvents = "none";

    for (const prop of mirrorProperties) {
      style[prop] = computed[prop];
    }

    if (isInput) {
      style.overflowX = "auto";
    } else {
      style.overflowY = "auto";
    }

    div.textContent = element.value.substring(0, position);
    if (isInput) {
      div.textContent = div.textContent.replace(/\s/g, "\u00a0");
    }

    const span = document.createElement("span");
    span.textContent = element.value.substring(position) || ".";
    div.appendChild(span);

    const parsedBorderTop =
      Number.parseInt(computed.borderTopWidth || "0", 10) || 0;
    const parsedBorderLeft =
      Number.parseInt(computed.borderLeftWidth || "0", 10) || 0;
    const parsedLineHeight = Number.parseInt(computed.lineHeight || "0", 10);

    const top = span.offsetTop + parsedBorderTop - element.scrollTop;
    const left = span.offsetLeft + parsedBorderLeft - element.scrollLeft;
    const height = parsedLineHeight || span.offsetHeight || 24;

    return {
      top: Math.max(0, top),
      left: Math.max(0, left),
      height: height > 0 ? height : 24,
    };
  } finally {
    div.remove();
  }
}
