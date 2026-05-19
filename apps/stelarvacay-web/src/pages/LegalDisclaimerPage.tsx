import { LegalChrome } from "../components/LegalChrome";

export default function LegalDisclaimerPage() {
  return (
    <LegalChrome title="Disclaimers">
      <section className="legal-section">
        <h2>Estimates, not prices you can pay here</h2>
        <p>
          CheapVacay India produces <strong>planning estimates</strong> and may show <strong>sample</strong> fares or hotel list prices from
          public sources. These are not offers, advertisements of specific inventory, or confirmations. Your final price, taxes, fees, and
          rules are determined by the airline, hotel, or other supplier you use when you book—always verify on their site or with them
          directly.
        </p>
      </section>
      <section className="legal-section">
        <h2>No booking guarantee</h2>
        <p>
          We do not hold seats, rooms, or activities. We do not control schedule changes, cancellations, weather, strikes, health events, or
          government travel rules. Any "buffer" or contingency in a model is a rough planning aid, not insurance.
        </p>
      </section>
      <section className="legal-section">
        <h2>Visa, health, and safety</h2>
        <p>
          In-app visa and health hints for international visitors are <strong>general orientation only</strong>. Requirements change by
          nationality and over time. Always check official government portals and a qualified professional (for example a travel-medicine
          clinician) before you travel.
        </p>
      </section>
      <section className="legal-section">
        <h2>AI-generated tips</h2>
        <p>
          Where the service uses AI to generate tips, that content may be incomplete or outdated. It is not a substitute for checking
          suppliers, documents, and local conditions yourself.
        </p>
      </section>
      <section className="legal-section">
        <h2>Maps, images, and third-party data</h2>
        <p>
          Destinations may use stock photography and approximate geodata. Names and boundaries on maps are for illustration; we make no claim
          of cartographic or legal precision.
        </p>
      </section>
    </LegalChrome>
  );
}
