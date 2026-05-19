type HeroProps = {
  onJumpToPlanner: () => void;
};

export function Hero({ onJumpToPlanner }: HeroProps) {
  return (
    <section className="hero">
      <div className="hero-copy homey-card">
        <span className="eyebrow">StelarVacay India</span>
        <h1>Honest trip budgets for India, without a checkout.</h1>
        <p className="homey-hero-lead">
          Pick a place, set how frugal you want to be, and get one clear <strong>planning number</strong> in INR. We are upfront: it is an
          estimate to compare options—not a live cart or a fare lock.
        </p>
        <div className="hero-actions">
          <button className="button button-primary" type="button" onClick={onJumpToPlanner}>
            Build a planning quote
          </button>
          <div className="hero-stat">
            <strong>9 hand-picked places</strong>
            <span>Calm, readable ranges instead of fake "live inventory" noise</span>
          </div>
        </div>
      </div>
      <div className="hero-card homey-card homey-hero-side">
        <p className="hero-card-label">What we promise</p>
        <ul>
          <li>Every line says whether it is modeled or a sample snapshot</li>
          <li>No claim that we can sell the seat or the room for this price</li>
          <li>Tips and AI stay inside safe, non-booking language</li>
        </ul>
      </div>
    </section>
  );
}
