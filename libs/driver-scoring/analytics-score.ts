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
  tripRate: { min: 0.5, weight: 30 },       // 0.5 trips per hour is reasonable
  activeRatio: { min: 0.3, weight: 30 },    // 30% active time is reasonable
  trips: { min: 10, weight: 20 },           // 10 trips per day is reasonable
  earnings: { min: 100, weight: 20 }        // $100 per day is reasonable
};

export function scoreDriverFromAnalytics(
  metrics: AnalyticsMetrics,
  config: AnalyticsScoreConfig = defaultAnalyticsScoreConfig
): number {
  const { hoursOnline, hoursOnTrip, trips, earnings } = metrics;
  const tripRate = hoursOnline > 0 ? trips / hoursOnline : 0;
  const activeRatio = hoursOnline > 0 ? hoursOnTrip / hoursOnline : 0;

  // Calculate graduated scores instead of all-or-nothing
  const tripRateScore = Math.min(1, tripRate / config.tripRate.min) * config.tripRate.weight;
  const activeRatioScore = Math.min(1, activeRatio / config.activeRatio.min) * config.activeRatio.weight;
  const tripsScore = Math.min(1, trips / config.trips.min) * config.trips.weight;
  const earningsScore = Math.min(1, earnings / config.earnings.min) * config.earnings.weight;

  const totalScore = tripRateScore + activeRatioScore + tripsScore + earningsScore;

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, totalScore));
} 