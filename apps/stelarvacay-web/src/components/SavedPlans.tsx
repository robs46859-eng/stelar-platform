import { formatInr } from "../lib/format";
import type { SavedTripPlan } from "../types";

type SavedPlansProps = {
  plans: SavedTripPlan[];
  selectedPlanId: string | null;
  onSelect: (plan: SavedTripPlan) => void;
};

export function SavedPlans({ plans, selectedPlanId, onSelect }: SavedPlansProps) {
  if (plans.length === 0) return null;

  return (
    <section className="section">
      <div className="section-heading">
        <span className="eyebrow">Persisted</span>
        <h2>Recent Trip Plans</h2>
      </div>
      <div className="saved-plan-list">
        {plans.map((plan) => {
          const selected = plan.id === selectedPlanId;
          return (
            <button
              className={`saved-plan-card${selected ? " saved-plan-card-selected" : ""}`}
              key={plan.id}
              onClick={() => onSelect(plan)}
              type="button"
              style={{
                backgroundColor: selected ? "var(--md-sys-color-secondary-container)" : "var(--md-sys-color-surface-container-low)",
                borderColor: selected ? "var(--md-sys-color-primary)" : "var(--md-sys-color-outline-variant)",
                color: selected ? "var(--md-sys-color-on-secondary-container)" : "var(--md-sys-color-on-surface)",
              }}
            >
              <div>
                <strong style={{ fontFamily: "var(--md-sys-typescale-title-large-font)", fontSize: "1.1rem" }}>
                  {plan.quote.destination.name}
                </strong>
                <p style={{ color: "inherit", opacity: 0.8, fontSize: "0.875rem", marginTop: "4px" }}>
                  {plan.request.travelers} pax · {plan.request.nights}n · {plan.request.origin}
                </p>
              </div>
              <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>{formatInr(plan.quote.total)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
