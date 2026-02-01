import { z } from "zod";

export const alertSchema = z.object({
    ruleName: z.string().min(2, "Name too short"),
    symbol: z.string().min(1, "Symbol required"),
    indicator: z.enum(["PRICE", "RSI", "MA"]),
    condition: z.enum(["GT", "LT", "CROSSOVER"]),
    value: z.number().min(0),
});

export type AlertFormValues = z.infer<typeof alertSchema>;
