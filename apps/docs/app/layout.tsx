import "./global.css";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | gritpos Docs",
    default: "gritpos Documentation",
  },
  description: "Documentation for gritpos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The project's theme decides how the docs look, as it does for the web app
  // and the admin panel, so fumadocs' own light/dark switch is off: it would
  // change half the tokens and leave the palette where it was. midnight is the
  // one dark palette, and fumadocs styles some of its own chrome through .dark.
  const theme = process.env.NEXT_PUBLIC_THEME || "atlas";

  return (
    <html
      lang="en"
      data-theme={theme}
      className={theme === "midnight" ? "dark" : undefined}
      suppressHydrationWarning
    >
      <body>
        <RootProvider
          theme={{
            enabled: false,
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
