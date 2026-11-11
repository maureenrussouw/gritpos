import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { source } from "@/app/source";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      // The project's THEME decides how this looks, so fumadocs' own light/dark
      // toggle is off. Leaving it on left a switch in the sidebar that changed
      // nothing, because the palette does not come from the .dark class.
      themeSwitch={{ enabled: false }}
      nav={{
        title: (
          <span className="flex items-center gap-2 font-bold">
            gritpos Docs
          </span>
        ),
      }}
    >
      {children}
    </DocsLayout>
  );
}
