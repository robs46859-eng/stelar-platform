import { Link } from "react-router-dom";

/**
 * In-page reference for "how pricing works" — linked from the planner.
 * Aligns with product copy; technical data options live in /docs/PRICING_DATA_OPTIONS.md
 */
export function PricingMethodologySection() {
  return (
    <section className="homey-methodology" id="how-pricing-works" aria-labelledby="methodology-title">
      <div className="homey-methodology-inner homey-card">
        <h2 id="methodology-title" className="homey-methodology-heading">
          How pricing works here
        </h2>
        <p className="homey-body-lead">
          StelarVacay India builds a <strong>single planning number in INR</strong> so you can compare destinations and tradeoffs. It is not a
          checkout, a fare guarantee, or a replacement for the price you will pay on another site.
        </p>
        <div className="homey-methodology-cols">
          <div>
            <h3 className="homey-h3">What the total includes</h3>
            <ul className="homey-list">
              <li>Intercity transport band (or a small sample of flight offers when available)</li>
              <li>Stay style band for your room count (or sample list prices as a reference)</li>
              <li>Modeled food, local movement, light activities, and a contingency buffer</li>
            </ul>
          </div>
          <div>
            <h3 className="homey-h3">What it never includes</h3>
            <ul className="homey-list">
              <li>Taxes, fees, and surcharges on the final booking site (GST, UDF, OTA service fees)</li>
              <li>Insurance, visa, rail cancellation policies, or dynamic airline rules</li>
              <li>"Best possible life" side trips—only the budget you asked for in the form</li>
            </ul>
          </div>
        </div>
        <p className="homey-body-small">
          Own your data: see <code className="homey-code">docs/PRICING_DATA_OPTIONS.md</code> in the repo for ways to build private benchmarks, pipe
          partner feeds, or blend APIs beyond Amadeus.{" "}
          Legal: <Link to="/terms">Terms</Link>, <Link to="/privacy">Privacy</Link>,{" "}
          <Link to="/legal/disclaimer">Disclaimers</Link>.
        </p>
      </div>
    </section>
  );
}
