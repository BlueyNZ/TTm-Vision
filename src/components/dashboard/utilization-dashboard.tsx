
"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Pie, PieChart, Cell } from "recharts"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const staffUtilizationData = [
  { month: "Jan", assigned: 186, available: 220 },
  { month: "Feb", assigned: 190, available: 220 },
  { month: "Mar", assigned: 207, available: 220 },
  { month: "Apr", assigned: 173, available: 220 },
  { month: "May", assigned: 209, available: 220 },
]

const fleetUtilizationData = [
  { name: "On-Site", value: 18, fill: "var(--color-onSite)" },
  { name: "In-Yard", value: 5, fill: "var(--color-inYard)" },
  { name: "In-Service", value: 2, fill: "var(--color-inService)" },
]

const chartConfig = {
  assigned: {
    label: "Assigned Days",
    color: "hsl(var(--primary))",
  },
  available: {
    label: "Available Days",
    color: "hsl(var(--secondary))",
  },
  onSite: { label: "On-Site", color: "hsl(var(--chart-1))" }, // Orange
  inYard: { label: "In-Yard", color: "hsl(var(--chart-3))" }, // Green
  inService: { label: "In-Service", color: "hsl(var(--chart-2))" }, // Blue
}

export function UtilizationDashboard() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Utilization Dashboard</CardTitle>
        <CardDescription>Staff and Fleet monthly overview</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col">
          <h3 className="text-md font-semibold mb-2">Staff Utilization (Days)</h3>
          <div className="flex-grow">
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
              <BarChart accessibilityLayer data={staffUtilizationData}>
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                 <YAxis />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="assigned" fill="var(--color-assigned)" radius={4} />
              </BarChart>
            </ChartContainer>
          </div>
        </div>
        <div className="flex flex-col">
           <h3 className="text-md font-semibold mb-2">Fleet Status</h3>
           <div className="flex-grow">
            <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square h-full"
              >
              <PieChart>
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                <Pie
                  data={fleetUtilizationData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  strokeWidth={5}
                >
                  {fleetUtilizationData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
           </div>
        </div>
      </CardContent>
    </Card>
  )
}
