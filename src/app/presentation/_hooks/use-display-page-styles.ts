"use client";

import { useEffect } from "react";

export function useDisplayPageStyles(backgroundColor: string) {
  useEffect(() => {
    const html = document.documentElement.style;
    const body = document.body.style;
    const previous = {
      htmlMargin: html.margin,
      htmlPadding: html.padding,
      htmlOverflow: html.overflow,
      bodyMargin: body.margin,
      bodyPadding: body.padding,
      bodyOverflow: body.overflow,
      bodyBackground: body.backgroundColor,
    };

    html.margin = "0";
    html.padding = "0";
    html.overflow = "hidden";
    body.margin = "0";
    body.padding = "0";
    body.overflow = "hidden";
    body.backgroundColor = backgroundColor;

    return () => {
      html.margin = previous.htmlMargin;
      html.padding = previous.htmlPadding;
      html.overflow = previous.htmlOverflow;
      body.margin = previous.bodyMargin;
      body.padding = previous.bodyPadding;
      body.overflow = previous.bodyOverflow;
      body.backgroundColor = previous.bodyBackground;
    };
  }, [backgroundColor]);
}
