import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SiteFooter } from "./SiteFooter";

type LegalChromeProps = {
  title: string;
  children: ReactNode;
};

export function LegalChrome({ title, children }: LegalChromeProps) {
  return (
    <div className="page-shell">
      <main className="page-content legal-page">
        <p className="legal-back">
          <Link to="/">← Back to CheapVacay India</Link>
        </p>
        <article className="homey-card legal-article">
          <h1>{title}</h1>
          <p className="legal-updated">Last updated: April 26, 2026. This is general information, not legal advice.</p>
          {children}
        </article>
        <SiteFooter />
      </main>
    </div>
  );
}
