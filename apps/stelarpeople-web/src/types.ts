export type PropertyStatus = 'occupied' | 'vacant' | 'maintenance' | 'listed';

export interface Property {
  id: string;
  name: string;
  address: string;
  units: number;
  occupiedUnits: number;
  status: PropertyStatus;
  monthlyRevenue: number;
}

export type ScreeningStatus = 'pending' | 'approved' | 'denied';

export interface Applicant {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  propertyName: string;
  appliedAt: string;
  creditScore: number;
  income: number;
  status: ScreeningStatus;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  propertyName: string;
  unit: string;
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: number;
}

export interface DashboardSummary {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  pendingApplications: number;
  activeTenants: number;
  monthlyRevenue: number;
}
