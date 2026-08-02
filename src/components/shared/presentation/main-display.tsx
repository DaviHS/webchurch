"use client";

import { useState, useEffect } from "react";

export default function MainDisplay() {
  const [text, setText] = useState("");
  const [isBlack, setIsBlack] = useState(false);
  const [slideInfo, setSlideInfo] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const channelName = params.get("channel");
    if (!channelName) return;

    const channel = new BroadcastChannel(channelName);

    channel.onmessage = (event) => {
      const msg = event.data;
      if (msg.type === "SLIDE") {
        setText(msg.text);
        setIsBlack(msg.isBlack);
        setSlideInfo(msg.slideInfo);
      }
      if (msg.type === "CLOSE") {
        window.close();
      }
    };

    channel.postMessage({ type: "READY", payload: { window: "main" } });

    const handleClick = () => {
      document.documentElement.requestFullscreen().catch(() => {});
    };
    document.addEventListener("click", handleClick, { once: true });

    return () => {
      channel.close();
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-8 cursor-pointer"
      style={{ backgroundColor: isBlack ? "#000000" : "#1e3a8a" }}
      onClick={() => {
        document.documentElement.requestFullscreen().catch(() => {});
      }}
    >
      {!isBlack && text && (
        <div className="text-center max-w-5xl w-full">
          <pre
            className="whitespace-pre-wrap font-sans leading-relaxed"
            style={{
              color: "#ffffff",
              fontSize: "2.5rem",
              lineHeight: "1.3",
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
            }}
          >
            {text}
          </pre>
        </div>
      )}
      {!text && (
        <p className="text-white text-xl">Aguardando...</p>
      )}
      {slideInfo && (
        <div className="fixed bottom-2 right-2 text-gray-500 text-xs">
          {slideInfo}
        </div>
      )}
    </div>
  );
}