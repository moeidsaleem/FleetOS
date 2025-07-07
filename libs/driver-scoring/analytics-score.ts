// Configurable analytics-based scoring for Uber driver metrics

export interface AnalyticsMetrics {
  hoursOnline: number;
  hoursOnTrip: number;
  trips: number;
  earnings: number;
}

export interface AnalyticsScoreConfig {
  tripRate: { min: number; weight: number };
  activeRatio: { min: number; weight: number };
  trips: { min: number; weight: number };
  earnings: { min: number; weight: number };
}

export const defaultAnalyticsScoreConfig: AnalyticsScoreConfig = {
  tripRate: { min: 0.1, weight: 30 },
  activeRatio: { min: 0.05, weight: 30 },
  trips: { min: 5, weight: 20 },
  earnings: { min: 250, weight: 20 }
};

export function scoreDriverFromAnalytics(
  metrics: AnalyticsMetrics,
  config: AnalyticsScoreConfig = defaultAnalyticsScoreConfig
): number {
  const { hoursOnline, hoursOnTrip, trips, earnings } = metrics;
  const tripRate = hoursOnline > 0 ? trips / hoursOnline : 0;
  const activeRatio = hoursOnline > 0 ? hoursOnTrip / hoursOnline : 0;

  let score = 0;
  if (tripRate >= config.tripRate.min) score += config.tripRate.weight;
  if (activeRatio >= config.activeRatio.min) score += config.activeRatio.weight;
  if (trips >= config.trips.min) score += config.trips.weight;
  if (earnings >= config.earnings.min) score += config.earnings.weight;

  return score;
} 