import { NextApiRequest, NextApiResponse } from "next";
import { AllProviderMetrics } from "@/types/metrics";
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

async function getMetrics(): Promise<AllProviderMetrics> {
  const groqMetrics = await fs.readFile(
    `${process.cwd()}/metrics/Groq/metrics.json`,
    "utf8",
  );
  const sambaNovaMetrics = await fs.readFile(
    `${process.cwd()}/metrics/SambaNova/metrics.json`,
    "utf8",
  );

  return {
    Groq: JSON.parse(groqMetrics),
    SambaNova: JSON.parse(sambaNovaMetrics),
  };
}
