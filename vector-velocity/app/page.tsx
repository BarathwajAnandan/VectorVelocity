"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { API_URL } from "@/lib/constants";
import { useState, useEffect } from "react";
import {
  RecentMetrics,
  LatestMetrics,
  Provider,
  AllProviderMetrics,
} from "@/types/metrics";
import { Speedometer } from "@/components/speedometer";
import { ProviderMetricWidgets } from "@/components/provider-metrics";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const Loading = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
    <div className="bg-white p-6 rounded-lg shadow-xl">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
    </div>
  </div>
);

export default function Home() {
  const [metrics, setMetrics] = useState<RecentMetrics>();
  const [latestMetrics, setLatestMetrics] = useState<LatestMetrics>();
  const [allProviderMetrics, setAllProviderMetrics] =
    useState<AllProviderMetrics>();
  const [loading, setLoading] = useState<boolean>(true);
  const [chartMetrics, setChartMetrics] = useState<Array<any>>();

  const updateLatestMetrics = async (recentMetrics: RecentMetrics) => {
    if (recentMetrics && Array.isArray(recentMetrics.recentMetrics)) {
      const sortedMetrics = recentMetrics.recentMetrics.sort(
        (a, b) =>
          new Date(b.metricDate).getTime() - new Date(a.metricDate).getTime(),
      );
      const latestMetric = sortedMetrics[0];
      setLatestMetrics(latestMetric);
    }
  };

  const getProviderMetrics = (provider: Provider) => {
    return latestMetrics?.metrics.find(
      (metric) => metric.provider === provider,
    );
  };

  const modifyMetricsForGraph = (metrics: Array<LatestMetrics>) => {
    return metrics.map((metric) => {
      let result: any = {
        metricDate: metric.metricDate,
      };

      metric.metrics.forEach((item) => {
        result[item.provider] = item.tokenVelocity;
      });

      return result;
    });
  };

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/metrics/recent`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => {
          setMetrics(data);
          updateLatestMetrics(data);
          const modifiedMetrics = modifyMetricsForGraph(data.recentMetrics);
          modifiedMetrics.sort((a, b) => {
            const dateA = new Date(a.metricDate).getTime();
            const dateB = new Date(b.metricDate).getTime();

            if (isNaN(dateA) || isNaN(dateB)) {
              throw new Error("Invalid date format");
            }

            return dateA - dateB;
          });
          setChartMetrics(modifiedMetrics);
        })
        .catch((error) => {
          // TODO: Add error banner here
          console.error("Fetch error:", error);
        }),
      fetch(`${API_URL}/metrics/providers/all`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => {
          setAllProviderMetrics(data);
        }),
    ]).then(() => setLoading(false));
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="grid grid-cols-1 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Latest Token Velocity</CardTitle>
          </CardHeader>
          <CardContent className="flex">
            <Speedometer
              value={getProviderMetrics(Provider.GROQ)?.tokenVelocity!}
              min={0}
              max={1000}
              label="Groq"
            />
            <Speedometer
              value={getProviderMetrics(Provider.SAMBANOVA)?.tokenVelocity!}
              min={0}
              max={1000}
              label="SambaNova"
            />
            <Speedometer
              value={getProviderMetrics(Provider.TOGETHER_AI)?.tokenVelocity!}
              min={0}
              max={1000}
              label="TogetherAI"
            />
            <Speedometer
              value={getProviderMetrics(Provider.FIREWORKS)?.tokenVelocity!}
              min={0}
              max={1000}
              label="Fireworks"
            />
          </CardContent>
          <CardFooter className="pt-4">
            <p className="text-xs text-muted-foreground">
              Updated 1 minute ago
            </p>
          </CardFooter>
        </Card>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Velocity Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {chartMetrics && chartMetrics.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metricDate" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="groq"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                    name="Groq"
                  />
                  <Line
                    type="monotone"
                    dataKey="fireworks"
                    stroke="#82ca9d"
                    activeDot={{ r: 8 }}
                    name="Fireworks"
                  />
                  <Line
                    type="monotone"
                    dataKey="sambanova"
                    stroke="#ffc658"
                    activeDot={{ r: 8 }}
                    name="SambaNova"
                  />
                  <Line
                    type="monotone"
                    dataKey="together_ai"
                    stroke="#cb0fff"
                    activeDot={{ r: 8 }}
                    name="TogetherAI"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : null}
          </CardContent>
        </Card>
        <ProviderMetricWidgets
          averageTokenVelocity={
            allProviderMetrics?.groq?.averageTokenVelocity.metricValue!
          }
          peakTokenVelocity={
            allProviderMetrics?.groq?.peakTokenVelocity.metricValue!
          }
          lowestTokenVelocity={
            allProviderMetrics?.groq?.lowestTokenVelocity.metricValue!
          }
          label="Groq"
        />
        <ProviderMetricWidgets
          averageTokenVelocity={
            allProviderMetrics?.sambanova?.averageTokenVelocity.metricValue!
          }
          peakTokenVelocity={
            allProviderMetrics?.sambanova?.peakTokenVelocity.metricValue!
          }
          lowestTokenVelocity={
            allProviderMetrics?.sambanova?.lowestTokenVelocity.metricValue!
          }
          label="SambaNova"
        />
        <ProviderMetricWidgets
          averageTokenVelocity={
            allProviderMetrics?.fireworks?.averageTokenVelocity.metricValue!
          }
          peakTokenVelocity={
            allProviderMetrics?.fireworks?.peakTokenVelocity.metricValue!
          }
          lowestTokenVelocity={
            allProviderMetrics?.fireworks?.lowestTokenVelocity.metricValue!
          }
          label="Fireworks"
        />
        <ProviderMetricWidgets
          averageTokenVelocity={
            allProviderMetrics?.together_ai?.averageTokenVelocity.metricValue!
          }
          peakTokenVelocity={
            allProviderMetrics?.together_ai?.peakTokenVelocity.metricValue!
          }
          lowestTokenVelocity={
            allProviderMetrics?.together_ai?.lowestTokenVelocity.metricValue!
          }
          label="TogetherAI"
        />
      </div>
    </div>
  );
}
