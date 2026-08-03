export interface Invoice {
  id: string;
  period: string; // e.g. "2026-07"
  bill_date: string;
  due_date: string;
  kwh: number;
  daily_avg_kwh: number;
  unit_rate_tl: number;
  net_amount_tl: number;
  total_amount_tl: number;
  tax_amount_tl?: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  meter_id?: string;
}

export interface UserAccount {
  name: string;
  meterNumber: string;
  address: string;
  city: string;
  tariff: string;
  engine: string;
  usageLimitKwh: number;
  currentUsageKwh: number;
  totalConsumption2025Tl: number;
  totalConsumption2025Kwh: number;
  totalConsumption2026Tl: number;
  totalConsumption2026Kwh: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  read: boolean;
}

export interface WeatherCondition {
  month: string;
  avgTempC: number;
  historicalKwh: number;
  predictedKwh: number;
  estimatedCostTl: number;
}
