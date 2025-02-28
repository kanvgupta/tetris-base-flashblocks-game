import { ethers } from "ethers";
import { Block } from "@/types";

// Endpoints
const STANDARD_RPC_URL = "https://sepolia.base.org";
const FLASH_RPC_URL = "https://sepolia-preconf.base.org";
const FLASH_WEBSOCKET_URL = "wss://sepolia.flashblocks.base.org/ws";

// Providers
const standardProvider = new ethers.JsonRpcProvider(STANDARD_RPC_URL);
const flashProvider = new ethers.JsonRpcProvider(FLASH_RPC_URL);

// Type for block transactions
type BlockTransaction = ethers.TransactionResponse | string;

// Keep track of the last flash block data
let lastFlashBlockData: Record<string, unknown> | null = null;

// Define transaction type for WebSocket data
interface WebSocketTransaction {
  hash: string;
  [key: string]: unknown;
}

// Fixed private key for transactions
const FIXED_PRIVATE_KEY =
  "0x4e52f7040ffc8cc461ae3f173b477cd630070a28eef0cb0ada947011ebb51346";

/**
 * Fetches the latest block from the standard endpoint
 */
export async function getLatestStandardBlock(): Promise<Block> {
  try {
    const blockNumber = await standardProvider.getBlockNumber();
    const block = await standardProvider.getBlock(blockNumber, true);

    if (!block) {
      throw new Error("Failed to fetch standard block");
    }

    return {
      number: block.number.toString(),
      hash: block.hash || "",
      transactions: block.transactions.map((tx: BlockTransaction) => ({
        hash: typeof tx === "string" ? tx : tx.hash || "",
        from: typeof tx === "string" ? "" : tx.from || "",
        to: typeof tx === "string" ? "" : tx.to || "",
        value: typeof tx === "string" ? "0" : tx.value.toString() || "0",
        gasPrice: typeof tx === "string" ? "0" : tx.gasPrice?.toString() || "0",
      })),
      timestamp: block.timestamp.toString(),
      gasLimit: block.gasLimit.toString(),
      gasUsed: block.gasUsed.toString(),
      parentHash: block.parentHash,
      isFlashBlock: false,
    };
  } catch (error) {
    console.error("Error fetching standard block:", error);
    throw error;
  }
}

/**
 * Fetches the latest block from the Flashblocks endpoint
 */
export async function getLatestFlashBlock(): Promise<Block> {
  try {
    const block = await flashProvider.getBlock("pending", true);

    if (!block) {
      throw new Error("Failed to fetch flash block");
    }

    return {
      number: block.number.toString(),
      hash: block.hash || "",
      transactions: block.transactions.map((tx: BlockTransaction) => ({
        hash: typeof tx === "string" ? tx : tx.hash || "",
        from: typeof tx === "string" ? "" : tx.from || "",
        to: typeof tx === "string" ? "" : tx.to || "",
        value: typeof tx === "string" ? "0" : tx.value.toString() || "0",
        gasPrice: typeof tx === "string" ? "0" : tx.gasPrice?.toString() || "0",
      })),
      timestamp: block.timestamp.toString(),
      gasLimit: block.gasLimit.toString(),
      gasUsed: block.gasUsed.toString(),
      parentHash: block.parentHash,
      isFlashBlock: true,
    };
  } catch (error) {
    console.error("Error fetching flash block:", error);
    throw error;
  }
}

/**
 * Gets the wallet from the fixed private key
 */
export function getFixedWallet(): ethers.Wallet {
  const wallet = new ethers.Wallet(FIXED_PRIVATE_KEY, standardProvider);
  return wallet;
}

/**
 * Submits a test transaction to the network
 */
export async function submitTestTransaction(
  wallet: ethers.Wallet | ethers.HDNodeWallet | null = null,
  toAddress: string,
  value: string = "0"
): Promise<string> {
  try {
    // Use the fixed wallet if none is provided
    const txWallet = wallet || getFixedWallet();

    console.log(`Sending transaction from: ${txWallet.address}`);

    const tx = await txWallet.sendTransaction({
      to: toAddress,
      value: ethers.parseEther(value),
    });

    console.log(`Transaction submitted: ${tx.hash}`);
    return tx.hash;
  } catch (error) {
    console.error("Error submitting transaction:", error);
    throw error;
  }
}

/**
 * Checks if a transaction is confirmed in a flash block using direct RPC call
 * This is faster than waiting for WebSocket updates
 */
export async function checkFlashBlockConfirmationRPC(
  txHash: string
): Promise<boolean> {
  try {
    console.log(`[RPC] Checking flash confirmation for tx: ${txHash}`);

    // Make a direct RPC call to get the transaction receipt
    const response = await fetch(FLASH_RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getTransactionReceipt",
        params: [txHash],
        id: 1,
      }),
    });

    const data = await response.json();

    // If we have a result with a blockNumber, the transaction is confirmed
    if (data.result && data.result.blockNumber) {
      const blockNumber = parseInt(data.result.blockNumber, 16);
      console.log(
        `✅ [RPC] Transaction ${txHash} confirmed in FLASH block ${blockNumber} (${new Date().toISOString()})`
      );
      return true;
    }

    // If we don't have a receipt yet, check if the transaction is in the pending block
    const pendingBlockResponse = await fetch(FLASH_RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getBlockByNumber",
        params: ["pending", true],
        id: 1,
      }),
    });

    const pendingBlockData = await pendingBlockResponse.json();

    // Check if the transaction is in the pending block
    if (
      pendingBlockData.result &&
      Array.isArray(pendingBlockData.result.transactions)
    ) {
      const found = pendingBlockData.result.transactions.some(
        (tx: any) => tx.hash && tx.hash.toLowerCase() === txHash.toLowerCase()
      );

      if (found) {
        console.log(
          `⏳ [RPC] Transaction ${txHash} found in FLASH pending block but not yet confirmed (${new Date().toISOString()})`
        );
      }
    }

    return false;
  } catch (error) {
    console.error("[RPC] Error checking flash confirmation:", error);
    return false;
  }
}

/**
 * Checks if a transaction is confirmed in a standard block using direct RPC call
 */
export async function checkStandardBlockConfirmationRPC(
  txHash: string
): Promise<boolean> {
  try {
    console.log(`[RPC] Checking standard confirmation for tx: ${txHash}`);

    // Make a direct RPC call to get the transaction receipt
    const response = await fetch(STANDARD_RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getTransactionReceipt",
        params: [txHash],
        id: 1,
      }),
    });

    const data = await response.json();

    // If we have a result with a blockNumber, the transaction is confirmed
    if (data.result && data.result.blockNumber) {
      const blockNumber = parseInt(data.result.blockNumber, 16);
      console.log(
        `✅ [RPC] Transaction ${txHash} confirmed in STANDARD block ${blockNumber} (${new Date().toISOString()})`
      );
      return true;
    }

    return false;
  } catch (error) {
    console.error("[RPC] Error checking standard confirmation:", error);
    return false;
  }
}

/**
 * Checks if a transaction is confirmed in a block
 */
export async function checkTransactionConfirmation(
  txHash: string,
  isFlashBlock: boolean
): Promise<boolean> {
  try {
    if (isFlashBlock) {
      // For flash blocks, we need to check the flash provider specifically
      console.log(`Checking flash confirmation for tx: ${txHash}`);

      try {
        // First check if the transaction is in a flash block
        const pendingReceipt = await flashProvider.getTransactionReceipt(
          txHash
        );

        if (pendingReceipt !== null && pendingReceipt.blockNumber !== null) {
          console.log(
            `✅ Transaction ${txHash} confirmed in FLASH block ${
              pendingReceipt.blockNumber
            } (${new Date().toISOString()})`
          );
          return true;
        }

        // If not found in a receipt, check if it's in the mempool
        const pendingTx = await flashProvider.getTransaction(txHash);
        if (pendingTx !== null) {
          console.log(
            `⏳ Transaction ${txHash} found in FLASH mempool but not yet confirmed (${new Date().toISOString()})`
          );
          return false;
        }

        console.log(
          `❓ Transaction ${txHash} not found in FLASH blocks or mempool (${new Date().toISOString()})`
        );
        return false;
      } catch (flashError) {
        console.error("Error checking flash confirmation:", flashError);

        // Try to check if the transaction exists in the standard chain
        // If it does, we'll consider it not confirmed in flash yet
        try {
          const standardReceipt = await standardProvider.getTransactionReceipt(
            txHash
          );
          if (
            standardReceipt !== null &&
            standardReceipt.blockNumber !== null
          ) {
            console.log(
              `⚠️ Transaction ${txHash} confirmed in STANDARD block ${
                standardReceipt.blockNumber
              } but flash provider unavailable (${new Date().toISOString()})`
            );
          }
        } catch (e) {
          // Ignore errors from this fallback check
        }

        return false;
      }
    } else {
      // For standard blocks, check the standard provider
      console.log(`Checking standard confirmation for tx: ${txHash}`);

      try {
        const receipt = await standardProvider.getTransactionReceipt(txHash);

        if (receipt !== null && receipt.blockNumber !== null) {
          console.log(
            `✅ Transaction ${txHash} confirmed in STANDARD block ${
              receipt.blockNumber
            } (${new Date().toISOString()})`
          );
          return true;
        }

        // If not found in a receipt, check if it's in the mempool
        const pendingTx = await standardProvider.getTransaction(txHash);
        if (pendingTx !== null) {
          console.log(
            `⏳ Transaction ${txHash} found in STANDARD mempool but not yet confirmed (${new Date().toISOString()})`
          );
          return false;
        }

        console.log(
          `❓ Transaction ${txHash} not found in STANDARD blocks or mempool (${new Date().toISOString()})`
        );
        return false;
      } catch (standardError) {
        console.error("Error checking standard confirmation:", standardError);
        return false;
      }
    }
  } catch (error) {
    console.error("Error in checkTransactionConfirmation:", error);
    return false;
  }
}

/**
 * Merges flash block diff data with the previous block data
 * According to the docs, each Flashblock only includes the diff data from the previous block
 */
function mergeFlashBlockData(
  prevData: Record<string, unknown> | null,
  diffData: Record<string, unknown>
): Record<string, unknown> {
  if (!prevData) {
    return diffData;
  }

  // Create a deep copy of the previous data
  const mergedData = { ...prevData };

  // Extract base and diff from the data
  const base = (prevData.base as Record<string, unknown>) || {};
  const diff = (diffData.diff as Record<string, unknown>) || {};
  const metadata = (diffData.metadata as Record<string, unknown>) || {};

  // Create a new merged object
  const result: Record<string, unknown> = {
    ...prevData,
    ...diffData,
  };

  // If we have base data, use it for block properties
  if (Object.keys(base).length > 0) {
    result.number = base.block_number
      ? typeof base.block_number === "string"
        ? parseInt(base.block_number.replace("0x", ""), 16).toString()
        : base.block_number.toString()
      : "";
    result.gasLimit = base.gas_limit
      ? typeof base.gas_limit === "string"
        ? parseInt(base.gas_limit.replace("0x", ""), 16).toString()
        : base.gas_limit.toString()
      : "";
    result.timestamp = base.timestamp
      ? typeof base.timestamp === "string"
        ? parseInt(base.timestamp.replace("0x", ""), 16).toString()
        : base.timestamp.toString()
      : "";
    result.parentHash = base.parent_hash || "";
  }

  // If we have metadata, use it for block number
  if (metadata && metadata.block_number) {
    result.number = metadata.block_number.toString();
  }

  // If we have diff data, use it for block properties
  if (Object.keys(diff).length > 0) {
    result.hash = diff.block_hash || "";
    result.gasUsed = diff.gas_used
      ? typeof diff.gas_used === "string"
        ? parseInt(diff.gas_used.replace("0x", ""), 16).toString()
        : diff.gas_used.toString()
      : "";

    // Handle transactions
    const transactions = diff.transactions || [];
    if (Array.isArray(transactions)) {
      // Convert transaction hashes to transaction objects
      result.transactions = transactions.map(
        (tx: string | Record<string, unknown>) => {
          if (typeof tx === "string") {
            return { hash: tx };
          }
          return tx;
        }
      );
    }
  }

  // Ensure isFlashBlock is set
  result.isFlashBlock = true;

  return result;
}

/**
 * Extracts a block from the Flashblocks WebSocket data
 */
function extractBlockFromFlashData(
  data: Record<string, unknown>
): Record<string, unknown> {
  const blockData: Record<string, unknown> = {};

  // Extract data from the payload
  const base = (data.base as Record<string, unknown>) || {};
  const diff = (data.diff as Record<string, unknown>) || {};
  const metadata = (data.metadata as Record<string, unknown>) || {};

  // Set block number
  if (metadata && metadata.block_number) {
    blockData.number = metadata.block_number.toString();
  } else if (base && base.block_number) {
    blockData.number =
      typeof base.block_number === "string"
        ? parseInt(base.block_number.replace("0x", ""), 16).toString()
        : base.block_number.toString();
  }

  // Set block hash
  if (diff && diff.block_hash) {
    blockData.hash = diff.block_hash;
  }

  // Set gas limit
  if (base && base.gas_limit) {
    blockData.gasLimit =
      typeof base.gas_limit === "string"
        ? parseInt(base.gas_limit.replace("0x", ""), 16).toString()
        : base.gas_limit.toString();
  }

  // Set gas used
  if (diff && diff.gas_used) {
    blockData.gasUsed =
      typeof diff.gas_used === "string"
        ? parseInt(diff.gas_used.replace("0x", ""), 16).toString()
        : diff.gas_used.toString();
  }

  // Set timestamp
  if (base && base.timestamp) {
    blockData.timestamp =
      typeof base.timestamp === "string"
        ? parseInt(base.timestamp.replace("0x", ""), 16).toString()
        : base.timestamp.toString();
  } else {
    blockData.timestamp = Date.now().toString();
  }

  // Set parent hash
  if (base && base.parent_hash) {
    blockData.parentHash = base.parent_hash;
  }

  // Set transactions
  if (diff && diff.transactions) {
    const transactions = diff.transactions;
    if (Array.isArray(transactions)) {
      blockData.transactions = transactions.map(
        (tx: string | Record<string, unknown>) => {
          if (typeof tx === "string") {
            return { hash: tx };
          }
          return tx;
        }
      );
    } else {
      blockData.transactions = [];
    }
  } else {
    blockData.transactions = [];
  }

  // Mark as flash block
  blockData.isFlashBlock = true;

  return blockData;
}

/**
 * Creates a WebSocket connection to the Flashblocks endpoint
 */
export function createFlashBlocksWebSocket(
  onMessage: (data: Record<string, unknown>) => void,
  onError: (error: Event) => void
): WebSocket {
  const ws = new WebSocket(FLASH_WEBSOCKET_URL);

  ws.onmessage = async (event) => {
    try {
      let rawData;

      // Handle different types of data
      if (event.data instanceof Blob) {
        // Handle binary data
        const text = await event.data.text();
        try {
          rawData = JSON.parse(text);
        } catch (_) {
          console.log(
            "Received binary data that is not JSON:",
            text.substring(0, 100)
          );
          return; // Skip non-JSON binary data
        }
      } else if (typeof event.data === "string") {
        // Handle text data
        try {
          rawData = JSON.parse(event.data);
        } catch (_) {
          console.log(
            "Received text data that is not JSON:",
            event.data.substring(0, 100)
          );
          return; // Skip non-JSON text data
        }
      } else {
        console.log("Received unsupported data type:", typeof event.data);
        return; // Skip unsupported data types
      }

      // Log the raw data for debugging
      console.log(
        "Received WebSocket data:",
        rawData.index !== undefined
          ? `index: ${rawData.index}`
          : "unknown index",
        rawData.metadata?.block_number
          ? `block: ${rawData.metadata.block_number}`
          : ""
      );

      // Check if this is an initial block or a diff
      const isInitialBlock = rawData.index === 0 || !lastFlashBlockData;

      // Process the data based on whether it's an initial block or a diff
      let processedData: Record<string, unknown>;

      if (isInitialBlock) {
        // For initial blocks, extract the block data
        processedData = extractBlockFromFlashData(rawData);
        console.log("Processed initial flash block:", processedData.number);

        // Store the raw data for future diffs
        lastFlashBlockData = rawData;
      } else {
        // For diffs, extract the block data from the diff
        const extractedDiff = extractBlockFromFlashData(rawData);
        processedData = extractedDiff;
        console.log("Processed flash block diff:", processedData.number);

        // Update the last flash block data
        lastFlashBlockData = rawData;
      }

      // Call the onMessage callback with the processed data
      onMessage(processedData);
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    onError(error);
  };

  ws.onopen = () => {
    console.log("WebSocket connected to Flashblocks endpoint");
  };

  ws.onclose = () => {
    console.log("WebSocket connection closed");
    // Reset the last flash block data
    lastFlashBlockData = null;
  };

  return ws;
}

/**
 * Generates a random wallet for test transactions
 * @deprecated Use getFixedWallet() instead
 */
export function generateTestWallet(): ethers.HDNodeWallet {
  const wallet = ethers.Wallet.createRandom();
  return wallet.connect(standardProvider);
}
