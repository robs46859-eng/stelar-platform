import { Link } from "react-router-dom";
import type { Destination } from "../types";
import { formatInr } from "../lib/format";

type DestinationRailProps = {
  destinations: Destination[];
  selectedId: string;
  onSelect: (destinationId: string) => void;
};

export function DestinationRail({ destinations, selectedId, onSelect }: DestinationRailProps) {
  return (
    <section className="section">
      <div className="section-heading">
        <span className="eyebrow">Destinations</span>
        <h2>Curated India Catalog</h2>
      </div>
      <div className="destination-grid">
        {destinations.map((destination) => {
          const selected = selectedId === destination.id;
          return (
            <button
              key={destination.id}
              type="button"
              className={`destination-card${selected ? " destination-card-selected" : ""}`}
              onClick={() => onSelect(destination.id)}
              style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}
            >
              <img
                src={destination.imageUrl}
                alt={destination.name}
                style={{ width: "100%", height: "140px", objectFit: "cover" }}
              />
              <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div className="destination-card-top">
                  <span>{destination.region}</span>
                  <strong>{destination.name}</strong>
                </div>
                <p style={{ fontSize: "0.875rem", margin: "8px 0" }}>{destination.hero}</p>
                <div className="destination-meta" style={{ marginTop: "auto" }}>
                  <span>{formatInr(destination.averageNightlyStay)}/n</span>
                  <span>{destination.tags.slice(0, 1).join("")}</span>
                </div>
                <Link
                  to={`/tour?mode=neighborhood&dest=${encodeURIComponent(destination.name)}&city=${encodeURIComponent(destination.region)}&state=IN`}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: 'block',
                    marginTop: '10px',
                    padding: '6px 10px',
                    background: 'rgba(16,185,129,0.12)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#059669',
                    textAlign: 'center',
                    textDecoration: 'none',
                  }}
                >
                  🌆 Walk the Neighborhood
                </Link>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
