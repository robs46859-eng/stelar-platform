import { Router } from "express";
import { buildQuote, listDestinations, parsePlannerRequest, type LiveDataValues } from "../domain/planner.ts";
import { generateWithGemma } from "../services/gateway.ts";
import { getUserTripPlans, saveTripPlan, deleteTripPlan } from "../persistence/tripPlans.ts";
import { getFlightPrice, getHotelPrice } from "../services/amadeus.ts";
import { requireFirebaseUser } from "../auth/bearer.ts";
import { config } from "../config.ts";
import { generalApiLimiter, quotePostLimiter } from "../middleware/rateLimits.ts";

export function createApiRouter() {
  const router = Router();
  router.use(generalApiLimiter);

  router.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "stelarvacay-api",
      product: config.product,
      rateLimit: { windowMin: Math.round(config.rateLimitWindowMs / 60_000), maxPerWindow: config.rateLimitMax },
    });
  });

  router.get("/destinations", (_req, res) => {
    res.json({ destinations: listDestinations() });
  });

  router.get("/plans", requireFirebaseUser, async (req, res) => {
    const userId = (req as any).userId!;
    const plans = await getUserTripPlans(userId);
    res.json({ plans });
  });

  router.delete("/plans/:planId", requireFirebaseUser, async (req, res) => {
    const userId = (req as any).userId!;
    const deleted = await deleteTripPlan(req.params.planId, userId);
    if (!deleted) {
      res.status(404).json({ error: "Saved plan not found." });
      return;
    }
    res.json({ ok: true });
  });

  router.post("/planner/quote", quotePostLimiter, requireFirebaseUser, async (req, res) => {
    try {
      const userId = (req as any).userId!;
      const request = parsePlannerRequest(req.body);
      const destinations = listDestinations();
      const dest = destinations.find((d) => d.id === request.destinationId);

      const liveData: LiveDataValues = {};
      if (dest) {
        const [flightPrice, hotelPrice] = await Promise.all([
          getFlightPrice(request.origin, dest.iataCode, request.travelDate, request.travelers),
          getHotelPrice(dest.iataCode, request.travelers),
        ]);
        liveData.flightPrice = flightPrice;
        liveData.hotelPricePerNight = hotelPrice;
      }

      const quote = buildQuote(request, liveData);
      const prompt = `You are a helpful travel advisor. Provide practical, friendly advice for this trip plan in 2-3 short paragraphs. Destination: ${quote.destination.name}. Duration: ${request.nights} nights. Budget profile: ${request.budgetProfile}. Total estimated budget: ${quote.total} INR. Focus on practical tips, what to watch out for, and how to make the most of the budget.`;
      const advice = await generateWithGemma(prompt);
      const savedPlan = await saveTripPlan(userId, request, quote, advice);
      res.json({ quote, advice, savedPlan });
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Planner error");
      console.error("Planner quote error:", err);
      const message = err.message || "Invalid request.";
      res.status(400).json({ error: message });
    }
  });

  router.use((_req, res) => {
    res.status(404).json({ error: "Not found." });
  });

  return router;
}
