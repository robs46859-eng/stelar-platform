export interface Neighborhood {
  id: string;
  name: string;
  city: string;
  state: string;
  walkScore: number;
  transitScore: number;
  bikeScore: number;
  safetyIndex: number;
  medianRent: number;
  corridorCount: number;
  population: number;
}

export interface Corridor {
  id: string;
  name: string;
  neighborhoodId: string;
  neighborhoodName: string;
  type: 'commercial' | 'mixed-use' | 'residential' | 'transit';
  businessCount: number;
  avgFootTraffic: number;
  vacancyRate: number;
  score: number;
}

export interface DashboardStats {
  neighborhoodCount: number;
  corridorCount: number;
  avgWalkScore: number;
  avgSafetyIndex: number;
}
