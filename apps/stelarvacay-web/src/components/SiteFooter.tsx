import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p className="site-footer-title">CheapVacay India</p>
        <nav className="site-footer-nav" aria-label="Legal">
          <Link to="/terms">Terms of use</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/legal/disclaimer">Disclaimers</Link>
        </nav>
        <p className="site-footer-fine">Planning estimates only—not a travel agency, booking service, or insurer.</p>
      </div>
    </footer>
  );
}
