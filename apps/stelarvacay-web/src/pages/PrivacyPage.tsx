import { LegalChrome } from "../components/LegalChrome";

export default function PrivacyPage() {
  return (
    <LegalChrome title="Privacy policy">
      <section className="legal-section">
        <h2>1. What we process</h2>
        <p>
          Depending on how you use CheapVacay India, we may process: account identifiers (for example, a sign-in provider subject id and email),
          trip planning inputs you submit (dates, destinations, preferences), generated quotes and saved plans stored in our backend, technical
          logs (including IP address, user agent, and request metadata for security and operations), and—if enabled—error reports sent to an
          error-tracking service (for example Sentry).
        </p>
      </section>
      <section className="legal-section">
        <h2>2. Why we process it</h2>
        <p>
          We use this information to run the service, authenticate users, persist plans you ask us to save, improve reliability, enforce rate
          limits, debug issues, and meet legal obligations.
        </p>
      </section>
      <section className="legal-section">
        <h2>3. Third-party processors</h2>
        <p>
          We use infrastructure and service providers (for example cloud hosting, authentication, database, optional analytics or error tracking,
          and optional AI features for travel tips). Those providers process data under their own terms and privacy policies, only as needed
          to deliver the service.
        </p>
      </section>
      <section className="legal-section">
        <h2>4. Retention</h2>
        <p>
          We keep saved plans and account-related records for as long as your account exists and as needed for operations, unless a shorter
          period is required by law. Logs may be retained for a limited period for security and troubleshooting.
        </p>
      </section>
      <section className="legal-section">
        <h2>5. International visitors</h2>
        <p>
          If you access the service from outside India, your information may be processed in India or in the countries where our processors
          operate. We do not provide visa, immigration, or medical advice; in-app hints are educational only.
        </p>
      </section>
      <section className="legal-section">
        <h2>6. Your choices</h2>
        <p>
          Where applicable law provides rights of access, correction, deletion, or objection, you may contact us to exercise those rights. You
          may stop using the service or sign out at any time.
        </p>
      </section>
      <section className="legal-section">
        <h2>7. Children</h2>
        <p>The service is not directed at children under 13 (or the minimum age in your jurisdiction). We do not knowingly collect their data.</p>
      </section>
      <section className="legal-section">
        <h2>8. Changes</h2>
        <p>We may update this policy; the "Last updated" date will change.</p>
      </section>
    </LegalChrome>
  );
}
