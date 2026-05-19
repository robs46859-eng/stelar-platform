export type InternationalVisitorHints = {
  /** Visa category & typical rule-of-thumb; not legal advice. */
  visa: string;
  /** Health prep: not medical advice. */
  health: string;
  /** "Advisor" one-liner for itinerary realism. */
  advisor: string;
};

export type DestinationRecord = {
  id: string;
  name: string;
  region: string;
  vibe: string;
  hero: string;
  imageUrl: string;
  iataCode: string;
  summary: string;
  bestMonths: string[];
  /** Months that tend to be costlier, crowded, or harsher—triggers a larger contingency in the model. */
  avoidMonths: string[];
  /** If true, June–Sept monsoon nudges contingency (coastal/hill mix). */
  monsoonSensitive: boolean;
  averageNightlyStay: number;
  averageMealBudget: number;
  localTransitDaily: number;
  tags: string[];
  highlights: string[];
  internationalVisitor: InternationalVisitorHints;
};

export const destinations: DestinationRecord[] = [
  {
    id: "goa",
    name: "Goa",
    region: "West Coast",
    vibe: "Beach reset with nightlife upside",
    hero: "Sunrise buses, hostel rooftops, and cheap seafood by scooter.",
    imageUrl: "https://images.unsplash.com/photo-1512789170774-8ebe47555bbd?auto=format&fit=crop&q=80&w=800",
    iataCode: "GOI",
    summary:
      "Goa works when you book transport early, stay slightly inland, and avoid the biggest holiday surges—our bands assume flexible dates.",
    bestMonths: ["November", "January", "February", "March"],
    avoidMonths: ["December", "April", "May"],
    monsoonSensitive: true,
    averageNightlyStay: 2400,
    averageMealBudget: 700,
    localTransitDaily: 450,
    tags: ["beach", "nightlife", "remote-work", "groups"],
    highlights: ["Hostel density", "Scooter-friendly", "Off-season bargains"],
    internationalVisitor: {
      visa: "Most visitors use a valid e-tourist visa (eTV) with leisure-only stays; check current rules on the official Indian e-Visa portal before you book.",
      health: "Use bottled or filtered water, pace spicy food, and consider hepatitis A/typhoid cover with your clinician—this is general prep, not a prescription.",
      advisor: "Split North vs South Goa if you want quieter nights; book Christmas/New Year months only if the model's buffer still feels right for you.",
    },
  },
  {
    id: "jaipur",
    name: "Jaipur",
    region: "Rajasthan",
    vibe: "History-heavy city break",
    hero: "Pink facades, fort days, cheap thalis, and strong rail access.",
    imageUrl: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&q=80&w=800",
    iataCode: "JAI",
    summary: "One of the easier budget wins: strong rail, dense sights, and realistic walk + auto budgets if you base near the old city.",
    bestMonths: ["October", "November", "December", "February"],
    avoidMonths: ["May", "June", "April"],
    monsoonSensitive: false,
    averageNightlyStay: 1800,
    averageMealBudget: 550,
    localTransitDaily: 350,
    tags: ["heritage", "food", "weekend", "solo"],
    highlights: ["Dense sightseeing", "Rail-friendly", "High value hotels"],
    internationalVisitor: {
      visa: "Standard tourist e-visa rules apply; keep a printed e-visa copy for hotel check-ins in some cases.",
      health: "Heat in Apr–Jun is real—hydration and sun cover matter more than extra vaccines for most short trips. Ask a clinician for personal advice.",
      advisor: "Cluster Amer Fort, City Palace, and Jantar Mantar in two days to cut local hops; we leave shopping off the line items on purpose.",
    },
  },
  {
    id: "manali",
    name: "Manali",
    region: "Himachal Pradesh",
    vibe: "Mountain escape with weather risk",
    hero: "Overnight buses, river views, and low-cost cafés in cold air.",
    imageUrl: "https://images.unsplash.com/photo-1591129841117-3adfd313e34f?auto=format&fit=crop&q=80&w=800",
    iataCode: "IXL",
    summary: "Good value when you book Delhi–Manali transport ahead and keep December/January expectations honest—hills are weather-dependent.",
    bestMonths: ["March", "April", "May", "September"],
    avoidMonths: ["December", "January", "June", "July", "August"],
    monsoonSensitive: true,
    averageNightlyStay: 1700,
    averageMealBudget: 600,
    localTransitDaily: 500,
    tags: ["mountains", "scenic", "couples", "weekend"],
    highlights: ["Affordable guesthouses", "Overnight bus network", "Shoulder-season value"],
    internationalVisitor: {
      visa: "Himachal is covered by a normal Indian tourist e-visa; some inner-line areas need extra permits (not in our default model).",
      health: "Altitude and cold: layer clothing; motion sickness on mountain roads is common—plan an extra rest day in the model if you're unsure.",
      advisor: "Skip peak snow week unless you pre-budget; our estimates assume shared Volvo buses and guesthouse stays, not private cabs on every leg.",
    },
  },
  {
    id: "munnar",
    name: "Munnar",
    region: "Kerala Highlands",
    vibe: "Slow scenic hills",
    hero: "Tea estates, winding roads, and quiet stays where timing matters.",
    imageUrl: "https://images.unsplash.com/photo-1593693397690-362cb9666ec2?auto=format&fit=crop&q=80&w=800",
    iataCode: "COK",
    summary: "Munnar is softer demand than the coast if you enter via Kochi and book shared hill transfers; weekend Kerala traffic can add hidden time.",
    bestMonths: ["September", "October", "January", "February"],
    avoidMonths: ["April", "May", "December"],
    monsoonSensitive: true,
    averageNightlyStay: 2100,
    averageMealBudget: 650,
    localTransitDaily: 400,
    tags: ["nature", "slow-travel", "couples", "photography"],
    highlights: ["Low-noise destination", "Good off-peak value", "Compact itinerary potential"],
    internationalVisitor: {
      visa: "Kerala is standard e-tourist territory; e-Visa is not valid for all entry points, so check your planned airport of entry (often Kochi).",
      health: "Leopards in tea estates are rare but twisty roads are not—arrive in daylight. Routine vaccines per your home country's India guidance.",
      advisor: "We price shared taxi splits in the local band, not a private car on standby—tweak nights upward if you want door-to-door comfort.",
    },
  },
  {
    id: "varanasi",
    name: "Varanasi",
    region: "Uttar Pradesh",
    vibe: "High-intensity cultural trip",
    hero: "Ghats at dawn, cheap rooms, and short-stay cultural density.",
    imageUrl: "https://images.unsplash.com/photo-1561359313-0639aad49ca6?auto=format&fit=crop&q=80&w=800",
    iataCode: "VNS",
    summary: "Among the best cultural value if you keep the stay short, central, and don't overbuy river tours—fares swing around festival dates.",
    bestMonths: ["October", "November", "December", "February"],
    avoidMonths: ["May", "June", "April"],
    monsoonSensitive: true,
    averageNightlyStay: 1400,
    averageMealBudget: 450,
    localTransitDaily: 250,
    tags: ["culture", "budget", "solo", "short-stay"],
    highlights: ["Low accommodation spend", "Dense cultural draw", "Short itinerary friendly"],
    internationalVisitor: {
      visa: "e-visa for tourism is typical; some nationalities have extra screening—double-check the official site before paying for flights.",
      health: "Gastro risk is the usual India trip note; we model modest street-food spend, not zero-risk dining.",
      advisor: "Arrive a full day before a tight international connection—our model does not pay for trip delay insurance; add that in your own stack.",
    },
  },
  {
    id: "udaipur",
    name: "Udaipur",
    region: "Rajasthan",
    vibe: "Lake & palace romance on a mid budget",
    hero: "Rooftop thalis, boat views, and walkable old-city lanes.",
    imageUrl: "https://images.unsplash.com/photo-1590013330455-1d89e6e0fe21?auto=format&fit=crop&q=80&w=800",
    iataCode: "UDR",
    summary: "Pricier than Jaipur per night in peak wedding season, but off-peak months keep it honest—lakeside stays vary wildly by view.",
    bestMonths: ["September", "October", "November", "January", "February"],
    avoidMonths: ["April", "May", "June", "December"],
    monsoonSensitive: true,
    averageNightlyStay: 2200,
    averageMealBudget: 600,
    localTransitDaily: 380,
    tags: ["lakes", "romantic", "heritage", "weekend"],
    highlights: ["Old city walkability", "Palace + boat bundles", "Shoulder value"],
    internationalVisitor: {
      visa: "Standard tourist e-visa; many hotels need passport copies (normal in India).",
      health: "Heat Apr–Jun is intense; our meal band assumes thali + café mix, not poolside minibar spend.",
      advisor: "If you are landing from abroad, we suggest two buffer nights: jet lag and lake humidity hit harder than the spreadsheet suggests.",
    },
  },
  {
    id: "rishikesh",
    name: "Rishikesh",
    region: "Uttarakhand",
    vibe: "Riverside yoga and adventure gateway",
    hero: "Budget ashrams, café culture, and Ganga aarti without a big-ticket price tag.",
    imageUrl: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&q=80&w=800",
    iataCode: "DED",
    summary: "Dehradun (DED) is the usual air hub; the model assumes a shared taxi band up to Rishikesh. Adventure add-ons (rafting) sit outside the base math.",
    bestMonths: ["March", "April", "October", "November"],
    avoidMonths: ["June", "July", "August", "May"],
    monsoonSensitive: true,
    averageNightlyStay: 1500,
    averageMealBudget: 500,
    localTransitDaily: 300,
    tags: ["wellness", "adventure", "solo", "budget"],
    highlights: ["Affordable guesthouses", "Global café scene", "Short hops to hills"],
    internationalVisitor: {
      visa: "Tourist e-visa; yoga stays are fine as leisure, not an employment workaround.",
      health: "River activities carry drowning risk; our activities line is a light buffer, not adventure insurance (buy separately).",
      advisor: "Weekends from Delhi can spike room rates—if your quote feels tight, try midweek; we can't know every long-weekend in advance.",
    },
  },
  {
    id: "hampi",
    name: "Hampi",
    region: "Karnataka",
    vibe: "Boulder-littered world heritage on a budget",
    hero: "Scooter or cycle days, simple stays, and ruins that do not need a posh base.",
    imageUrl: "https://images.unsplash.com/photo-1596005559704-71220d7e5bb8?auto=format&fit=crop&q=80&w=800",
    iataCode: "BLR",
    summary: "We price BLR or Hubli style entry and a long road transfer in the intercity feel—Hampi rewards slow, cheap days, not big ticket nights.",
    bestMonths: ["October", "November", "December", "January", "February"],
    avoidMonths: ["April", "May", "March"],
    monsoonSensitive: true,
    averageNightlyStay: 1200,
    averageMealBudget: 400,
    localTransitDaily: 280,
    tags: ["heritage", "backpacker", "photography", "slow-travel"],
    highlights: ["UNESCO site density", "Low spend floor", "Simple guesthouses"],
    internationalVisitor: {
      visa: "Karnataka is standard e-tourist; keep soft copies of visa + passport in Google Drive for rural guesthouses that photograph IDs.",
      health: "Heat mid-year is no joke; sun and hydration matter more in ruins than a vaccine checklist for most short trips (ask your clinician).",
      advisor: "We assume bicycle or scooter day-use; if you need a private car every day, raise transport preference or accept that our band is off.",
    },
  },
  {
    id: "ooty",
    name: "Ooty (Udhagamandalam)",
    region: "Tamil Nadu Nilgiris",
    vibe: "Hill-station cool with tea and toy-train mood",
    hero: "Cozy stays, nilgiri views, and shared cab splits from Coimbatore.",
    imageUrl: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=800",
    iataCode: "CJB",
    summary: "Coimbatore (CBJ) is the common fly-in; the model bakes a hill ghat transfer. Peak domestic holidays in summer move prices fast—avoid list shows that risk.",
    bestMonths: ["March", "April", "May", "September", "October"],
    avoidMonths: ["December", "June", "July", "August"],
    monsoonSensitive: true,
    averageNightlyStay: 2000,
    averageMealBudget: 550,
    localTransitDaily: 350,
    tags: ["hills", "families", "nature", "train"],
    highlights: ["Cooler climes", "Shared taxi culture", "Tea estate day trips"],
    internationalVisitor: {
      visa: "Standard e-visa; Tamil Nadu is straightforward for tourists on leisure itineraries.",
      health: "Nilgiri twisties can bring motion sickness; if you are prone, plan medication with a clinician, not from this app.",
      advisor: "Toy train seats need advance booking; our rail/flight line does not model IRCTC quota magic—treat the total as a planning ceiling.",
    },
  },
];
