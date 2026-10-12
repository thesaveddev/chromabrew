import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to ChromaBrew to save and revisit your design systems and color palettes.",
  robots: { index: false },
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
