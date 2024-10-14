import { NextApiRequest, NextApiResponse } from "next";
import { AllProviderMetrics } from "@/types/metrics";
import { getRandomInteger } from "@/lib/utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  switch (req.method) {
    case "GET":
      const metrics = await getMetrics();
      return res.status(200).json(metrics);
    default:
      return res.status(405).json({ message: "Not supported" });
  }
}

async function getMetrics(): Promise<AllProviderMetrics> {
  // TODO: Fetch metrics from local storage
  const dummyMetrics = {
    averageTokenVelocity: {
      metricDate: "2023-06-15",
      metricValue: getRandomInteger(300, 500),
    },
    peakTokenVelocity: {
      metricDate: "2023-06-15",
      metricValue: getRandomInteger(300, 500),
    },
    lowestTokenVelocity: {
      metricDate: "2023-06-15",
      metricValue: getRandomInteger(300, 500),
    },
  };

  return {
    Groq: dummyMetrics,
    SambaNova: dummyMetrics,
  };
}
