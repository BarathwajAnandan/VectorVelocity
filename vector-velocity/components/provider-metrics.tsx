import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";

export interface IProviderMetricWidgets {
  peakTokenVelocity: number;
  lowestTokenVelocity: number;
  label: string;
}

export const ProviderMetricWidgets = (props: IProviderMetricWidgets) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {props.label} - Peak Token Velocity
          </CardTitle>
          <ArrowUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {props.peakTokenVelocity} tokens/s
          </div>
          <p className="text-xs text-muted-foreground">Reached on May 15</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {props.label} - Lowest Token Velocity
          </CardTitle>
          <ArrowDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {props.lowestTokenVelocity} tokens/s
          </div>
          <p className="text-xs text-muted-foreground">Recorded on April 3</p>
        </CardContent>
      </Card>
    </div>
  );
};
