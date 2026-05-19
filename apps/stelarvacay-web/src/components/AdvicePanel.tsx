type AdvicePanelProps = {
  advice: string;
};

export function AdvicePanel({ advice }: AdvicePanelProps) {
  return (
    <section className="section advice-shell">
      <div className="section-heading">
        <span className="eyebrow">Practical guide</span>
        <h2>How to use this for your real trip</h2>
        <p className="homey-subtitle">Friendly suggestions—not live booking or fare rules from airlines.</p>
      </div>
      <div className="advice-card homey-advice-card">
        <p className="homey-advice-text">{advice}</p>
      </div>
    </section>
  );
}
