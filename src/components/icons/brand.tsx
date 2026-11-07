import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function Instagram(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

/** Ícone cheio do YouTube (retângulo vermelho com o triângulo branco). */
export function Youtube(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" aria-hidden {...props}>
      <rect x="1" y="4.5" width="22" height="15" rx="4.5" fill="#FF0000" />
      <path d="m9.9 8.7 5.6 3.3-5.6 3.3z" fill="#fff" />
    </svg>
  );
}

/** Ícone cheio do Spotify (círculo verde com as três ondas). */
export function Spotify(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" aria-hidden {...props}>
      <circle cx="12" cy="12" r="11" fill="#1DB954" />
      <g fill="none" stroke="#fff" strokeWidth={1.9} strokeLinecap="round">
        <path d="M6.2 9.2c3.8-1.1 8.3-.8 11.6 1.2" strokeWidth={2.3} />
        <path d="M7 12.6c3.2-.9 6.6-.5 9.4 1.2" />
        <path d="M7.8 15.7c2.6-.7 5.1-.4 7.2.9" strokeWidth={1.6} />
      </g>
    </svg>
  );
}
