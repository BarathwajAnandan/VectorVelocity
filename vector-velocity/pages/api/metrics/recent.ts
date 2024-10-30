import { NextApiRequest, NextApiResponse } from "next";
import { RecentMetrics, Provider } from "@/types/metrics";
import { promises as fs } from "fs";

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

async function getMetrics(): Promise<RecentMetrics> {
  const recentMetrics = await fs.readFile(
    `${process.cwd()}/metrics/recent_metrics/metrics.json`,
    "utf8",
  );
  return JSON.parse(recentMetrics);
}
