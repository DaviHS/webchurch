import { Lora, Poppins } from "next/font/google";

export const fontSans = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const fontBook = Lora({
  subsets: ["latin"],
  variable: "--font-book",
  display: "swap",
});
