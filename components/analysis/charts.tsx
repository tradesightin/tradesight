"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { PieChart, Pie } from "recharts";

interface SimpleBarChartProps {
    data: any[];
    xKey: string;
    yKey: string;
    color?: string;
}

export function SimpleBarChart({ data, xKey, yKey, color = "#2563eb" }: SimpleBarChartProps) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <XAxis
                    dataKey={xKey}
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                    contentStyle={{ borderRadius: "8px" }}
                    cursor={{ fill: "transparent" }}
                />
                <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

interface DistributionPieChartProps {
    data: { name: string; value: number; color: string }[];
}

export function DistributionPieChart({ data }: DistributionPieChartProps) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}
