"use client";

import { useState, useEffect } from "react";

export default function StageDisplay() {
  const [text, setText] = useState("");
  const [nextText, setNextText] = useState("");
  const [isBlack, setIsBlack] = useState(false);
  const [slideInfo, setSlideInfo] = useState("");
  const [songTitle, setSongTitle] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const channelName = params.get("channel");
    if (!channelName) return;

    const channel = new BroadcastChannel(channelName);

    channel.onmessage = (event) => {
      const msg = event.data;
      if (msg.type === "SLIDE") {
        setText(msg.text);
        setNextText(msg.nextText || "");
        setIsBlack(msg.isBlack);
        setSlideInfo(msg.slideInfo);
        setSongTitle(msg.songTitle || "");
      }
      if (msg.type === "CLOSE") {
        window.close();
      }
    };

    channel.postMessage({ type: "READY", payload: { window: "stage" } });

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
      className="fixed inset-0 flex flex-col cursor-pointer"
      style={{ backgroundColor: "#111827" }}
      onClick={() => {
        document.documentElement.requestFullscreen().catch(() => {});
      }}
    >
      <div className="flex-1 flex items-center justify-center p-6">
        {isBlack ? (
          <div className="bg-black w-full h-full rounded-lg" />
        ) : text ? (
          <div className="text-center max-w-4xl w-full">
            <pre
              className="whitespace-pre-wrap font-sans leading-relaxed"
              style={{ color: "#ffffff", fontSize: "2rem", lineHeight: "1.3" }}
            >
              {text}
            </pre>
          </div>
        ) : (
          <p className="text-white text-xl">Aguardando...</p>
        )}
      </div>

      <div className="h-1/4 bg-gray-800 border-t border-gray-700 p-4 flex items-center justify-center">
        {!isBlack && nextText ? (
          <div className="text-center max-w-3xl w-full">
            <p className="text-gray-400 text-xs uppercase mb-2">Próximo</p>
            <pre
              className="whitespace-pre-wrap font-sans leading-relaxed"
              style={{ color: "#9ca3af", fontSize: "1.25rem", lineHeight: "1.3" }}
            >
              {nextText}
            </pre>
          </div>
        ) : (
          <p className="text-gray-600 text-sm">
            {isBlack ? "Tela preta ativada" : text ? "Fim da música" : "Aguardando..."}
          </p>
        )}
      </div>

      <div className="bg-gray-900 px-3 py-1 flex justify-between items-center flex-shrink-0">
        <span className="text-gray-500 text-xs">{songTitle}</span>
        <span className="text-gray-500 text-xs">{slideInfo}</span>
      </div>
    </div>
  );
}