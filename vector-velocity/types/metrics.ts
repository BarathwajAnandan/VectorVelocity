export enum Provider {
  GROQ = "Groq",
  SAMBANOVA = "SambaNova",
}

export type Metric = {
  provider: Provider;
  tokenVelocity: number;
};

export type LatestMetrics = {
  metricDate: string;
  metrics: Array<Metric>;
};

export type RecentMetrics = {
  recentMetrics: Array<LatestMetrics>;
};

export type ProviderMetric = {
  metricDate: string;
  metricValue: number;
};

export type ProviderMetrics = {
  averageTokenVelocity: ProviderMetric;
  peakTokenVelocity: ProviderMetric;
  lowestTokenVelocity: ProviderMetric;
};

export type AllProviderMetrics = {
  [key in Provider]: ProviderMetrics;
};
