import { Invoice, UserAccount, NotificationItem } from '../types';

export const initialAccount: UserAccount = {
  name: 'Konstantin Kuzminykh',
  meterNumber: '0767090390',
  address: 'Atatürk Cad. No:11 Şekerplaza K.2 D.12',
  city: 'Kemer, Antalya',
  tariff: 'MESKEN AG',
  engine: 'V2.1 ENGINE',
  usageLimitKwh: 10000,
  currentUsageKwh: 7407,
  totalConsumption2025Tl: 27175,
  totalConsumption2025Kwh: 7407,
  totalConsumption2026Tl: 28770,
  totalConsumption2026Kwh: 5055,
};

export const initialInvoices: Invoice[] = [
  { id: 'inv-2025-01', period: '2025-01', bill_date: '27.01.2025', due_date: '06.02.2025', kwh: 735.21, daily_avg_kwh: 22.98, unit_rate_tl: 2.4439, net_amount_tl: 1796.84, total_amount_tl: 2385.00, tax_amount_tl: 588.16, status: 'PAID' },
  { id: 'inv-2025-02', period: '2025-02', bill_date: '25.02.2025', due_date: '07.03.2025', kwh: 647.58, daily_avg_kwh: 22.33, unit_rate_tl: 2.4350, net_amount_tl: 1576.82, total_amount_tl: 1775.00, tax_amount_tl: 198.18, status: 'PAID' },
  { id: 'inv-2025-03', period: '2025-03', bill_date: '25.03.2025', due_date: '04.04.2025', kwh: 361.77, daily_avg_kwh: 12.92, unit_rate_tl: 2.2009, net_amount_tl: 796.22, total_amount_tl: 890.00, tax_amount_tl: 93.78, status: 'PAID' },
  { id: 'inv-2025-04', period: '2025-04', bill_date: '25.04.2025', due_date: '05.05.2025', kwh: 242.44, daily_avg_kwh: 7.82, unit_rate_tl: 2.1707, net_amount_tl: 526.27, total_amount_tl: 585.00, tax_amount_tl: 58.73, status: 'PAID' },
  { id: 'inv-2025-05', period: '2025-05', bill_date: '27.05.2025', due_date: '10.06.2025', kwh: 251.93, daily_avg_kwh: 7.87, unit_rate_tl: 2.3302, net_amount_tl: 587.05, total_amount_tl: 655.00, tax_amount_tl: 67.95, status: 'PAID' },
  { id: 'inv-2025-06', period: '2025-06', bill_date: '26.06.2025', due_date: '07.07.2025', kwh: 378.73, daily_avg_kwh: 12.62, unit_rate_tl: 2.7410, net_amount_tl: 1038.11, total_amount_tl: 1160.00, tax_amount_tl: 121.89, status: 'PAID' },
  { id: 'inv-2025-07', period: '2025-07', bill_date: '28.07.2025', due_date: '07.08.2025', kwh: 1181.18, daily_avg_kwh: 36.91, unit_rate_tl: 3.2086, net_amount_tl: 3789.89, total_amount_tl: 4260.00, tax_amount_tl: 470.11, status: 'PAID' },
  { id: 'inv-2025-08', period: '2025-08', bill_date: '26.08.2025', due_date: '05.09.2025', kwh: 1221.63, daily_avg_kwh: 42.13, unit_rate_tl: 3.2387, net_amount_tl: 3956.43, total_amount_tl: 4445.00, tax_amount_tl: 488.57, status: 'PAID' },
  { id: 'inv-2025-09', period: '2025-09', bill_date: '25.09.2025', due_date: '06.10.2025', kwh: 754.51, daily_avg_kwh: 25.15, unit_rate_tl: 3.0949, net_amount_tl: 2335.14, total_amount_tl: 2620.00, tax_amount_tl: 284.86, status: 'PAID' },
  { id: 'inv-2025-10', period: '2025-10', bill_date: '23.10.2025', due_date: '03.11.2025', kwh: 240.90, daily_avg_kwh: 8.60, unit_rate_tl: 2.4089, net_amount_tl: 580.31, total_amount_tl: 645.00, tax_amount_tl: 64.69, status: 'PAID' },
  { id: 'inv-2025-11', period: '2025-11', bill_date: '25.11.2025', due_date: '05.12.2025', kwh: 253.48, daily_avg_kwh: 7.68, unit_rate_tl: 2.3302, net_amount_tl: 590.67, total_amount_tl: 660.00, tax_amount_tl: 69.33, status: 'PAID' },
  { id: 'inv-2025-12', period: '2025-12', bill_date: '26.12.2025', due_date: '05.01.2026', kwh: 678.10, daily_avg_kwh: 21.87, unit_rate_tl: 4.8930, net_amount_tl: 3317.94, total_amount_tl: 3760.00, tax_amount_tl: 442.06, status: 'PAID' },
  { id: 'inv-2026-01', period: '2026-01', bill_date: '27.01.2026', due_date: '06.02.2026', kwh: 1511.57, daily_avg_kwh: 47.24, unit_rate_tl: 5.2088, net_amount_tl: 7873.49, total_amount_tl: 8945.00, tax_amount_tl: 1071.51, status: 'PAID' },
  { id: 'inv-2026-02', period: '2026-02', bill_date: '24.02.2026', due_date: '06.03.2026', kwh: 939.36, daily_avg_kwh: 33.55, unit_rate_tl: 4.4413, net_amount_tl: 4171.99, total_amount_tl: 4720.00, tax_amount_tl: 548.01, status: 'PAID' },
  { id: 'inv-2026-03', period: '2026-03', bill_date: '26.03.2026', due_date: '06.04.2026', kwh: 756.65, daily_avg_kwh: 25.22, unit_rate_tl: 4.1294, net_amount_tl: 3124.50, total_amount_tl: 3535.00, tax_amount_tl: 410.50, status: 'PAID' },
  { id: 'inv-2026-04', period: '2026-04', bill_date: '24.04.2026', due_date: '04.05.2026', kwh: 281.82, daily_avg_kwh: 9.72, unit_rate_tl: 4.0660, net_amount_tl: 1145.85, total_amount_tl: 1290.00, tax_amount_tl: 144.15, status: 'PAID' },
  { id: 'inv-2026-05', period: '2026-05', bill_date: '21.05.2026', due_date: '01.06.2026', kwh: 143.95, daily_avg_kwh: 5.33, unit_rate_tl: 4.3207, net_amount_tl: 621.96, total_amount_tl: 695.00, tax_amount_tl: 73.04, status: 'PAID' },
  { id: 'inv-2026-06', period: '2026-06', bill_date: '23.06.2026', due_date: '03.07.2026', kwh: 288.10, daily_avg_kwh: 8.73, unit_rate_tl: 4.3207, net_amount_tl: 1244.77, total_amount_tl: 1400.00, tax_amount_tl: 155.23, status: 'PAID' },
  { id: 'inv-2026-07', period: '2026-07', bill_date: '28.07.2026', due_date: '07.08.2026', kwh: 1133.58, daily_avg_kwh: 32.39, unit_rate_tl: 5.6028, net_amount_tl: 6351.17, total_amount_tl: 7185.00, tax_amount_tl: 833.83, status: 'PENDING' },
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'n-1',
    title: 'Ожидается оплата за Июль 2026',
    message: 'Счет на сумму 7 185 TL подлежит оплате до 07.08.2026 (Счетчик № 0767090390).',
    timestamp: '2 часа назад',
    type: 'warning',
    read: false,
  },
  {
    id: 'n-2',
    title: 'Индексация тарифа',
    message: 'Средний тариф за кВт·ч вырос на +104% год к году (текущий: 5.69 TL/кВт·ч).',
    timestamp: '1 день назад',
    type: 'info',
    read: false,
  },
  {
    id: 'n-3',
    title: 'Порог годового лимита',
    message: 'Вы израсходовали 7.4k кВт·ч из лимита 10k кВт·ч (74%).',
    timestamp: '3 дня назад',
    type: 'alert',
    read: true,
  },
  {
    id: 'n-4',
    title: 'Синхронизация Google Таблиц',
    message: 'Все 19 счетов успешно синхронизированы с таблицей 1bpvsP4vqHut...',
    timestamp: '5 дней назад',
    type: 'success',
    read: true,
  }
];
