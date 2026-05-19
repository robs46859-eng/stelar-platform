import { useEffect, useMemo, useRef, useState } from "react";
import { AdvicePanel } from "../components/AdvicePanel";
import { AuthBar } from "../components/AuthBar";
import { DestinationRail } from "../components/DestinationRail";
import { Hero } from "../components/Hero";
import { PlannerForm } from "../components/PlannerForm";
import { PricingMethodologySection } from "../components/PricingMethodologySection";
import { QuoteCard } from "../components/QuoteCard";
import { SavedPlans } from "../components/SavedPlans";
import { SiteFooter } from "../components/SiteFooter";
import { fetchDestinations, fetchSavedPlans, requestQuote } from "../lib/api";
import type { Destination, PlannerQuote, PlannerRequest, SavedTripPlan } from "../types";

export default function HomePage() {
  const plannerRef = useRef<HTMLElement | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('stelar_token'));
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [quote, setQuote] = useState<PlannerQuote | null>(null);
  const [advice, setAdvice] = useState("");
  const [savedPlans, setSavedPlans] = useState<SavedTripPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sync token changes from storage events (other tabs)
  useEffect(() => {
    const handler = () => setToken(localStorage.getItem('stelar_token'));
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  useEffect(() => {
    if (!token) {
      setQuote(null);
      setAdvice("");
      setSelectedPlanId(null);
      setSavedPlans([]);
    }
  }, [token]);

  useEffect(() => {
    fetchDestinations()
      .then((items) => {
        setDestinations(items);
        setSelectedId((current) => current || items[0]?.id || "");
      })
      .catch((reason: Error) => {
        setError(reason.message || "Could not load app data.");
      });
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchSavedPlans()
      .then((payload) => {
        if (cancelled) return;
        setSavedPlans(payload.plans);
        if (payload.plans[0]) {
          hydratePlan(payload.plans[0]);
        }
      })
      .catch((reason: Error) => {
        if (!cancelled) {
          setError(reason.message || "Could not load saved plans.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const selectedDestination = useMemo(
    () => destinations.find((entry) => entry.id === selectedId)?.id ?? "",
    [destinations, selectedId],
  );

  async function handleQuote(request: PlannerRequest) {
    if (!token) {
      setError("Sign in to get a quote.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await requestQuote(request);
      hydratePlan(response.savedPlan);
      setSavedPlans((current) => [response.savedPlan, ...current.filter((plan) => plan.id !== response.savedPlan.id)].slice(0, 8));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Failed to generate quote.");
    } finally {
      setLoading(false);
    }
  }

  function hydratePlan(plan: SavedTripPlan) {
    setQuote(plan.quote);
    setAdvice(plan.advice);
    setSelectedPlanId(plan.id);
    setSelectedId(plan.quote.destination.id);
  }

  const canPlan = Boolean(token);
  const showPlannerBody = canPlan && destinations.length > 0;

  return (
    <div className="page-shell">
      <div className="page-backdrop" />
      <main className="page-content">
        <header className="page-top">
          <AuthBar
            token={token}
            onTokenChange={(next) => {
              setToken(next);
              if (next) {
                localStorage.setItem('stelar_token', next);
              } else {
                localStorage.removeItem('stelar_token');
              }
            }}
            onAuthError={(message) => {
              setError(message);
            }}
          />
        </header>
        <div className="section-wrapper bg-palette-a">
          <Hero onJumpToPlanner={() => plannerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} />
          <DestinationRail destinations={destinations} selectedId={selectedId} onSelect={setSelectedId} />
          <PricingMethodologySection />
        </div>

        <div className="section-wrapper bg-palette-b">
          {canPlan && savedPlans.length > 0 ? (
            <SavedPlans plans={savedPlans} selectedPlanId={selectedPlanId} onSelect={hydratePlan} />
          ) : null}
          <section ref={plannerRef}>
            {!token ? (
              <div className="planner-gate homey-card">
                <h2 className="planner-gate-title">Sign in to plan</h2>
                <p>Sign in to get budget quotes, save trips, and sync plans across your devices. Destinations above are free to browse.</p>
              </div>
            ) : showPlannerBody ? (
              <PlannerForm
                destinations={destinations}
                initialDestinationId={selectedDestination}
                onSubmit={handleQuote}
                loading={loading}
              />
            ) : null}
          </section>
        </div>

        {quote ? (
          <div className="section-wrapper bg-palette-c">
            <QuoteCard quote={quote} />
            {advice ? <AdvicePanel advice={advice} /> : null}
          </div>
        ) : null}

        {error ? <div className="error-banner">{error}</div> : null}
        <SiteFooter />
      </main>
    </div>
  );
}
