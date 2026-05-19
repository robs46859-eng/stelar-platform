import { formatInr } from "../lib/format";
import type { PlannerQuote, PricingTransparency } from "../types";

type QuoteCardProps = {
  quote: PlannerQuote;
};

const badgeLabel: Record<PricingTransparency["badge"], string> = {
  planning_estimate: "Planning estimate",
  sample_fares_mixed: "Sample fares + benchmarks",
  sample_fares_both: "Sample fares (flights + stay)",
};

function defaultTransparency(quote: PlannerQuote): PricingTransparency {
  if (quote.transparency) return quote.transparency;
  return {
    badge: quote.isLiveData ? "sample_fares_mixed" : "planning_estimate",
    shortTitle: quote.isLiveData ? "Mixed live samples and estimates" : "Benchmark-based estimate",
    bullets: [
      "Not a booking or invoice. Compare trips, then book elsewhere when ready.",
      "Older saved plans may not include full detail—generate a new quote for the latest wording.",
    ],
  };
}

export function QuoteCard({ quote }: QuoteCardProps) {
  const t = defaultTransparency(quote);
  const badge = badgeLabel[t.badge];

  return (
    <section className="section results-shell homey-section">
      <div className="homey-honesty-banner" role="status">
        <p className="homey-honesty-kicker">Pricing honesty</p>
        <h3 className="homey-honesty-title">{t.shortTitle}</h3>
        <p className="homey-honesty-lead">
          We help you <strong>plan</strong> a budget, not check out. Nothing here reserves a seat, room, or car.
        </p>
        <ul className="homey-honesty-list">
          {t.bullets.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      {quote.seasonal ? (
        <div className="homey-seasonal-callout" role="note">
          <p className="homey-seasonal-kicker">Season &amp; timing</p>
          <p className="homey-seasonal-title">
            {quote.seasonal.monthName} — {quote.seasonal.shortLabel}
          </p>
          {quote.seasonal.lines.length > 0 ? (
            <ul className="homey-seasonal-list">
              {quote.seasonal.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="section-heading">
        <div className="section-heading-row">
          <span className="eyebrow">Your quote</span>
          <span className={`homey-badge homey-badge--${t.badge}`} title="How much of this came from public fare samples">
            {badge}
          </span>
        </div>
        <h2 className="homey-display-sub">
          {quote.destination.name} — about {formatInr(quote.total)} total
        </h2>
        <p className="homey-subtitle">Ranging figure in INR, before your real bookings.</p>
      </div>
      <div className="results-grid">
        <article className="metric-card homey-metric homey-metric--accent">
          <span className="homey-metric-label">Total trip plan</span>
          <strong className="homey-metric-value">{formatInr(quote.total)}</strong>
          <p className="homey-metric-hint">≈ {formatInr(quote.dailyAverage)} / night all-in in this model.</p>
        </article>
        <article className="metric-card homey-metric">
          <span className="homey-metric-label">Travel approach</span>
          <strong className="homey-metric-strong">{quote.travelMode}</strong>
          <p className="homey-metric-hint">{quote.scorecard.complexity} logistics.</p>
        </article>
        <article className="metric-card homey-metric">
          <span className="homey-metric-label">Comfort band</span>
          <strong className="homey-metric-strong">{quote.scorecard.comfort}</strong>
          <p className="homey-metric-hint">{quote.scorecard.value}</p>
        </article>
      </div>

      <h3 className="homey-breakdown-title">Line items</h3>
      <p className="homey-breakdown-sub">Each line shows how the number was built. "Sample" = from a public offer snapshot, not a hold.</p>
      <div className="breakdown-list">
        {quote.breakdown.map((item) => {
          const source = item.source ?? "modeled";
          return (
            <article className="breakdown-row homey-breakdown-row" key={item.label}>
              <div>
                <div className="homey-line-head">
                  <strong>{item.label}</strong>
                  <span className={source === "live_sample" ? "homey-pill homey-pill--live" : "homey-pill homey-pill--model"}>
                    {source === "live_sample" ? "Sample fare" : "Benchmark"}
                  </span>
                </div>
                <p className="homey-line-notes">{item.notes}</p>
              </div>
              <span className="homey-line-amount">{formatInr(item.amount)}</span>
            </article>
          );
        })}
      </div>

      <div className="homey-rationale">
        <p className="homey-rationale-title">How we&apos;re thinking about this trip</p>
        <ul>
          {quote.rationale.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
