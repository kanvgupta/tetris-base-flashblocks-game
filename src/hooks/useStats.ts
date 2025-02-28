import { useState, useEffect } from "react";
import { StatsState, GameBlock } from "@/types";

export function useStats(
  standardBlocks: GameBlock[],
  flashBlocks: GameBlock[],
  standardConfirmationTime: number | null,
  flashConfirmationTime: number | null
) {
  const [stats, setStats] = useState<StatsState>({
    standardBlocksPerMinute: 0,
    flashBlocksPerMinute: 0,
    averageStandardConfirmationTime: 0,
    averageFlashConfirmationTime: 0,
    standardTransactionThroughput: 0,
    flashTransactionThroughput: 0,
  });

  // Track blocks per minute
  useEffect(() => {
    const updateInterval = 5000; // Update every 5 seconds
    const timeWindow = 60000; // 1 minute in milliseconds

    const calculateStats = () => {
      const now = Date.now();

      // Count blocks in the last minute
      const recentStandardBlocks = standardBlocks.filter(
        (block) => now - parseInt(block.id.split("-")[2]) < timeWindow
      );

      const recentFlashBlocks = flashBlocks.filter(
        (block) => now - parseInt(block.id.split("-")[2]) < timeWindow
      );

      // Calculate blocks per minute
      const standardBlocksPerMinute =
        recentStandardBlocks.length * (60000 / timeWindow);
      const flashBlocksPerMinute =
        recentFlashBlocks.length * (60000 / timeWindow);

      // Calculate transaction throughput
      const standardTransactions = recentStandardBlocks.reduce(
        (sum, block) => sum + block.transactionCount,
        0
      );

      const flashTransactions = recentFlashBlocks.reduce(
        (sum, block) => sum + block.transactionCount,
        0
      );

      const standardTransactionThroughput =
        standardTransactions * (60000 / timeWindow);
      const flashTransactionThroughput =
        flashTransactions * (60000 / timeWindow);

      // Update confirmation times if available
      const averageStandardConfirmationTime =
        standardConfirmationTime || stats.averageStandardConfirmationTime;
      const averageFlashConfirmationTime =
        flashConfirmationTime || stats.averageFlashConfirmationTime;

      setStats({
        standardBlocksPerMinute,
        flashBlocksPerMinute,
        averageStandardConfirmationTime,
        averageFlashConfirmationTime,
        standardTransactionThroughput,
        flashTransactionThroughput,
      });
    };

    // Initial calculation
    calculateStats();

    // Set up interval for regular updates
    const interval = setInterval(calculateStats, updateInterval);

    return () => {
      clearInterval(interval);
    };
  }, [
    standardBlocks,
    flashBlocks,
    standardConfirmationTime,
    flashConfirmationTime,
    stats.averageStandardConfirmationTime,
    stats.averageFlashConfirmationTime,
  ]);

  return stats;
}
