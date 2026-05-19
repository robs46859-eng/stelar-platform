import { useEffect, useMemo, useState } from "react";
import type { Destination, PlannerRequest } from "../types";

type PlannerFormProps = {
  destinations: Destination[];
  initialDestinationId: string;
  onSubmit: (request: PlannerRequest) => Promise<void>;
  loading: boolean;
};

export function PlannerForm({ destinations, initialDestinationId, onSubmit, loading }: PlannerFormProps) {
  const [origin, setOrigin] = useState("DEL");
  const [destinationId, setDestinationId] = useState(initialDestinationId);
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split("T")[0]);
  const [travelers, setTravelers] = useState(2);
  const [nights, setNights] = useState(3);
  const [budgetProfile, setBudgetProfile] = useState<PlannerRequest["budgetProfile"]>("smart");
  const [transportPreference, setTransportPreference] = useState<PlannerRequest["transportPreference"]>("balanced");
  const [stayType, setStayType] = useState<PlannerRequest["stayType"]>("homestay");

  const destination = useMemo(
    () => destinations.find((entry) => entry.id === destinationId) ?? destinations[0],
    [destinations, destinationId],
  );

  useEffect(() => {
    setDestinationId(initialDestinationId);
  }, [initialDestinationId]);

  return (
    <section className="section planner-shell" id="planner">
      <div className="section-heading">
        <span className="eyebrow">Planner</span>
        <h2>Build your budget</h2>
        <p className="homey-planner-intro">
          You&apos;ll get a <strong>planning estimate in INR</strong>—use it to compare trips, not as a final bill.{" "}
          <a className="homey-inline-link" href="#how-pricing-works">
            How pricing works
          </a>
        </p>
      </div>
      <form
        className="planner-form"
        onSubmit={async (event) => {
          event.preventDefault();
          await onSubmit({
            origin,
            destinationId,
            travelDate,
            travelers,
            nights,
            budgetProfile,
            transportPreference,
            stayType,
          });
        }}
      >
        <label>
          Origin city (IATA)
          <select value={origin} onChange={(event) => setOrigin(event.target.value)}>
            <option value="DEL">Delhi (DEL)</option>
            <option value="BOM">Mumbai (BOM)</option>
            <option value="BLR">Bangalore (BLR)</option>
            <option value="MAA">Chennai (MAA)</option>
            <option value="CCU">Kolkata (CCU)</option>
            <option value="HYD">Hyderabad (HYD)</option>
          </select>
        </label>
        <label>
          Destination
          <select value={destinationId} onChange={(event) => setDestinationId(event.target.value)}>
            {destinations.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
        <label style={{ gridColumn: "span 2" }}>
          Travel date
          <input type="date" value={travelDate} onChange={(event) => setTravelDate(event.target.value)} min={new Date().toISOString().split("T")[0]} />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", gridColumn: "span 2" }}>
          <label>
            Travelers
            <input
              type="number"
              min={1}
              max={8}
              value={travelers}
              onChange={(event) => setTravelers(Number(event.target.value))}
            />
          </label>
          <label>
            Nights
            <input
              type="number"
              min={1}
              max={21}
              value={nights}
              onChange={(event) => setNights(Number(event.target.value))}
            />
          </label>
        </div>
        <label>
          Budget profile
          <select value={budgetProfile} onChange={(event) => setBudgetProfile(event.target.value as PlannerRequest["budgetProfile"])}>
            <option value="lean">Lean</option>
            <option value="smart">Smart</option>
            <option value="comfort">Comfort</option>
          </select>
        </label>
        <label>
          Stay type
          <select value={stayType} onChange={(event) => setStayType(event.target.value as PlannerRequest["stayType"])}>
            <option value="hostel">Hostel</option>
            <option value="homestay">Homestay</option>
            <option value="boutique">Boutique</option>
          </select>
        </label>
        <label style={{ gridColumn: "span 2" }}>
          Transport bias
          <select
            value={transportPreference}
            onChange={(event) => setTransportPreference(event.target.value as PlannerRequest["transportPreference"])}
          >
            <option value="cheapest">Cheapest</option>
            <option value="balanced">Balanced</option>
            <option value="fastest">Fastest</option>
          </select>
        </label>

        <aside className="planner-sidecard" style={{ padding: 0, overflow: "hidden" }}>
          {destination?.imageUrl && (
            <img
              src={destination.imageUrl}
              alt={destination.name}
              style={{ width: "100%", height: "200px", objectFit: "cover" }}
            />
          )}
          <div style={{ padding: "24px" }}>
            <strong style={{ fontSize: "1.5rem" }}>{destination?.name}</strong>
            <p style={{ marginTop: "8px", fontSize: "1rem" }}>{destination?.summary}</p>
            <div className="planner-sidecard-tags" style={{ marginTop: "16px" }}>
              {destination?.highlights.map((highlight) => (
                <span key={highlight}>{highlight}</span>
              ))}
            </div>
            {destination?.internationalVisitor ? (
              <details className="homey-visitor-hints" style={{ marginTop: "1.25rem" }}>
                <summary>International visitors — visa, health, advisor tips</summary>
                <p>
                  <strong>Visa (not legal advice):</strong> {destination.internationalVisitor.visa}
                </p>
                <p>
                  <strong>Health prep:</strong> {destination.internationalVisitor.health}
                </p>
                <p style={{ marginBottom: 0 }}>
                  <strong>Advisor-style tip:</strong> {destination.internationalVisitor.advisor}
                </p>
              </details>
            ) : null}
          </div>
        </aside>

        <details className="homey-planner-disclosure">
          <summary>What you are (and aren&apos;t) getting</summary>
          <p>
            Quotes blend destination benchmarks with optional <strong>sample</strong> flight or hotel list prices. We never place a hold or take
            payment. Your real price appears when you book on a partner or airline site.
          </p>
        </details>

        <button className="button button-primary planner-submit" disabled={loading} type="submit">
          {loading ? "Building quote…" : "Generate planning quote"}
        </button>
      </form>
    </section>
  );
}
