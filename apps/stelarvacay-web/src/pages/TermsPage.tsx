import { Link } from "react-router-dom";
import { LegalChrome } from "../components/LegalChrome";

export default function TermsPage() {
  return (
    <LegalChrome title="Terms of use">
      <section className="legal-section">
        <h2>1. The service</h2>
        <p>
          CheapVacay India ("we," "us") provides a web application that helps you model and compare <strong>estimated</strong> trip costs in
          India and may show sample public fare or list-price information. We are <strong>not</strong> a travel agency, tour operator, airline,
          hotel, insurance provider, or payment processor.
        </p>
      </section>
      <section className="legal-section">
        <h2>2. No booking, no guarantee</h2>
        <p>
          Nothing on the service reserves a seat, room, vehicle, or activity. Quotes and ranges are <strong>planning tools only</strong>, in
          Indian Rupees unless stated otherwise, and may differ materially from what you pay when you book with a third party. We do not
          guarantee availability, price, schedule, visa approval, health outcomes, or safety.
        </p>
      </section>
      <section className="legal-section">
        <h2>3. Accounts and acceptable use</h2>
        <p>
          Where sign-in is offered, you agree to provide accurate information and keep credentials secure. You will not misuse the API,
          attempt to bypass rate limits or security controls, scrape the service in a way that harms operations, or use the service for unlawful
          purposes.
        </p>
      </section>
      <section className="legal-section">
        <h2>4. Third parties and links</h2>
        <p>
          We may integrate third-party data sources (for example, global distribution or mapping APIs). Those providers have their own terms.
          Your relationship when you book travel is with the carrier or supplier you choose—not with us.
        </p>
      </section>
      <section className="legal-section">
        <h2>5. Disclaimers</h2>
        <p>
          The service is provided "as is."           To the maximum extent permitted by law, we disclaim implied warranties of merchantability, fitness
          for a particular purpose, and non-infringement. See also the <Link to="/legal/disclaimer">Disclaimers</Link> page.
        </p>
      </section>
      <section className="legal-section">
        <h2>6. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, we are not liable for any indirect, incidental, special, consequential, or punitive damages,
          or for any loss of profits, data, or goodwill, arising from your use of the service. Our aggregate liability for any claim relating
          to the service should not exceed the greater of (a) the amounts you paid us in the twelve months before the claim (if any) or (b)
          zero if the service is free.
        </p>
      </section>
      <section className="legal-section">
        <h2>7. Changes</h2>
        <p>We may update these terms; the "Last updated" date will change. Continued use after changes constitutes acceptance of the revised terms.</p>
      </section>
      <section className="legal-section">
        <h2>8. Contact</h2>
        <p>For questions about these terms, contact us through the channels provided in your deployment (e.g. project maintainer email).</p>
      </section>
    </LegalChrome>
  );
}
