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
                    dataKey="Groq"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                    name="Groq"
                  />
                  <Line
                    type="monotone"
                    dataKey="SambaNova"
                    stroke="#ffc658"
                    activeDot={{ r: 8 }}
                    name="SambaNova"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : null}
          </CardContent>
        </Card>
        <ProviderMetricWidgets
          averageTokenVelocity={
            allProviderMetrics?.Groq?.averageTokenVelocity.metricValue!
          }
          peakTokenVelocity={
            allProviderMetrics?.Groq?.peakTokenVelocity.metricValue!
          }
          lowestTokenVelocity={
            allProviderMetrics?.Groq?.lowestTokenVelocity.metricValue!
          }
          label="Groq"
        />
        <ProviderMetricWidgets
          averageTokenVelocity={
            allProviderMetrics?.SambaNova?.averageTokenVelocity.metricValue!
          }
          peakTokenVelocity={
            allProviderMetrics?.SambaNova?.peakTokenVelocity.metricValue!
          }
          lowestTokenVelocity={
            allProviderMetrics?.SambaNova?.lowestTokenVelocity.metricValue!
          }
          label="SambaNova"
        />
      </div>
    </div>
  );
}
