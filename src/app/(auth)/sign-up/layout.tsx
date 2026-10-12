import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Create a free ChromaBrew account to save design systems, share projects and revisit your palettes.",
  robots: { index: false },
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
