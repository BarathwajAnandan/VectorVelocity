import { NextApiRequest, NextApiResponse } from "next";
import { LatestMetrics, Provider } from "@/types/metrics";
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

async function getMetrics(): Promise<LatestMetrics> {
  // TODO: Fetch metrics from local storage
  return {
    metricDate: "2023-06-15",
    metrics: [
      {
        provider: Provider.GROQ,
        tokenVelocity: getRandomInteger(300, 500),
      },
      {
        provider: Provider.SAMBANOVA,
        tokenVelocity: getRandomInteger(300, 500),
      },
      {
        provider: Provider.TOGETHER_AI,
        tokenVelocity: getRandomInteger(300, 500),
      },
      {
        provider: Provider.FIREWORKS,
        tokenVelocity: getRandomInteger(300, 500),
      },
    ],
  };
}
