// Type declarations for Prisma Client when not generated
// This file provides stub types for development/build environments
// where prisma generate cannot run (e.g., no database connection)

declare module '@prisma/client' {
    export class PrismaClient {
        constructor(options?: any);
        [key: string]: any;
        $transaction(fn: (tx: any) => Promise<any>): Promise<any>;
        $connect(): Promise<void>;
        $disconnect(): Promise<void>;
    }

    export namespace Prisma {
        type TradeCreateInput = any;
        type TradeUpdateInput = any;
        type TradeWhereInput = any;
        type TradeWhereUniqueInput = any;
        type PortfolioCreateInput = any;
        type PortfolioWhereInput = any;
        type UserWhereInput = any;
        type AlertRuleCreateInput = any;
        type AlertCreateInput = any;
        [key: string]: any;
    }

    export type Trade = {
        id: string;
        userId: string;
        symbol: string;
        buyDate: Date;
        sellDate: Date | null;
        buyPrice: number;
        sellPrice: number | null;
        quantity: number;
        profitLoss: number | null;
        holdingPeriodDays: number | null;
        createdAt: Date;
    };

    export type Portfolio = {
        id: string;
        userId: string;
        symbol: string;
        quantity: number;
        avgBuyPrice: number;
        currentPrice: number;
        unrealizedPL: number;
        lastUpdated: Date;
    };

    export type User = {
        id: string;
        email: string;
        password: string | null;
        name: string | null;
        phone: string | null;
        zerodhaUserId: string | null;
        zerodhaAccessToken: string | null;
        image: string | null;
        virtualBalance: number;
        createdAt: Date;
        updatedAt: Date;
    };

    export type AlertRule = {
        id: string;
        userId: string;
        ruleName: string;
        ruleType: string;
        parameters: any;
        isActive: boolean;
        createdAt: Date;
    };

    export type Alert = {
        id: string;
        userId: string;
        alertRuleId: string | null;
        symbol: string;
        message: string;
        priority: string;
        isRead: boolean;
        triggeredAt: Date;
    };

    export type TechnicalAnalysis = {
        id: string;
        symbol: string;
        stage: number;
        stageChangedDate: Date | null;
        greenFlags: any;
        redFlags: any;
        greenFlagCount: number;
        redFlagCount: number;
        ma50: number | null;
        ma200: number | null;
        rsi: number | null;
        macd: number | null;
        volumeSMA10: number | null;
        volumeSMA20: number | null;
        relativeStrength: number | null;
        analyzedAt: Date;
    };

    export type VirtualTrade = {
        id: string;
        userId: string;
        symbol: string;
        type: string;
        quantity: number;
        price: number;
        totalValue: number;
        createdAt: Date;
    };

    export type VirtualPortfolio = {
        id: string;
        userId: string;
        symbol: string;
        quantity: number;
        avgBuyPrice: number;
        updatedAt: Date;
    };
}

declare module '@prisma/adapter-pg' {
    export class PrismaPg {
        constructor(pool: any);
    }
}

declare module '@auth/prisma-adapter' {
    export function PrismaAdapter(client: any): any;
}
