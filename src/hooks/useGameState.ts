import { useState, useEffect, useCallback, useRef } from "react";
import { useWindowSize } from "react-use";
import {
  getLatestStandardBlock,
  getLatestFlashBlock,
  createFlashBlocksWebSocket,
  checkTransactionConfirmation,
  checkFlashBlockConfirmationRPC,
  checkStandardBlockConfirmationRPC,
} from "@/lib/blockchain";
import { GameState, GameBlock, CatcherState, Block } from "@/types";

// Constants
const STANDARD_BLOCK_INTERVAL = 2000; // 2 seconds
const FLASH_BLOCK_INTERVAL = 200; // 200 milliseconds
const STANDARD_BLOCK_COLOR = "#3366CC";
const FLASH_BLOCK_COLOR = "#FF9900";
const BLOCK_WIDTH = 80;
const BLOCK_HEIGHT = 60;
const CATCHER_HEIGHT = 20;
const CATCHER_WIDTH = 150;
const POINTS_STANDARD_BLOCK = 10;
const POINTS_FLASH_BLOCK = 5;
const MAX_BLOCKS = 50; // Maximum number of blocks to keep in state

export function useGameState() {
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const gameWidth = Math.min(windowWidth, 800);
  const gameHeight = Math.min(windowHeight - 100, 600);

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    standardBlocksCaught: 0,
    flashBlocksCaught: 0,
    userTransactionHash: null,
    userTransactionConfirmedInStandard: false,
    userTransactionConfirmedInFlash: false,
    standardConfirmationTime: null,
    flashConfirmationTime: null,
  });

  // Ref to track current game state without creating dependencies
  const gameStateRef = useRef<GameState>(gameState);

  // Keep gameStateRef in sync with gameState
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Blocks state
  const [standardBlocks, setStandardBlocks] = useState<GameBlock[]>([]);
  const [flashBlocks, setFlashBlocks] = useState<GameBlock[]>([]);

  // Track newly caught blocks
  const [newlyCaughtStandard, setNewlyCaughtStandard] = useState<GameBlock[]>(
    []
  );
  const [newlyCaughtFlash, setNewlyCaughtFlash] = useState<GameBlock[]>([]);

  // Catcher state
  const [catcher, setCatcher] = useState<CatcherState>({
    x: gameWidth / 2 - CATCHER_WIDTH / 2,
    width: CATCHER_WIDTH,
  });

  // Animation frame reference
  const animationFrameRef = useRef<number | null>(null);

  // Timestamps for transaction confirmation tracking
  const transactionSubmitTimeRef = useRef<number | null>(null);

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  const wsConnectedRef = useRef<boolean>(false);

  // Track processed blocks to avoid duplicates
  const processedFlashBlocksRef = useRef<Set<string>>(new Set());
  const processedStandardBlocksRef = useRef<Set<string>>(new Set());

  // Track which method confirmed the transaction first
  const flashConfirmationMethodRef = useRef<string | null>(null);
  const standardConfirmationMethodRef = useRef<string | null>(null);

  // Track the lowest confirmation times
  const lowestFlashConfirmationTimeRef = useRef<number | null>(null);
  const lowestStandardConfirmationTimeRef = useRef<number | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const handleWebSocketMessage = (data: Record<string, unknown>) => {
      const userTxHash = gameStateRef.current.userTransactionHash;

      if (userTxHash) {
        console.log(`Checking flash block for user transaction: ${userTxHash}`);
      }

      if (data && typeof data.number === "string") {
        // Check if we've already processed this block
        const blockId = `${data.number}-${data.hash}`;
        if (processedFlashBlocksRef.current.has(blockId)) {
          return;
        }

        // Mark this block as processed
        processedFlashBlocksRef.current.add(blockId);

        // Log the received flash block
        console.log(
          `Received flash block: ${data.number} with ${
            Array.isArray(data.transactions) ? data.transactions.length : 0
          } transactions`
        );

        // Convert WebSocket data to Block format
        const blockData: Block = {
          number: data.number,
          hash: typeof data.hash === "string" ? data.hash : "",
          transactions: Array.isArray(data.transactions)
            ? data.transactions.map((tx: Record<string, unknown>) => {
                const txHash = typeof tx.hash === "string" ? tx.hash : "";
                const isUserTx =
                  userTxHash !== null &&
                  txHash.toLowerCase() === userTxHash.toLowerCase();

                // Log if we find the user's transaction in a flash block
                if (isUserTx) {
                  console.log(
                    `Found user transaction ${userTxHash} in flash block ${data.number}`
                  );
                }

                return {
                  hash: txHash,
                  from: typeof tx.from === "string" ? tx.from : "",
                  to: typeof tx.to === "string" ? tx.to : "",
                  value: typeof tx.value === "string" ? tx.value : "0",
                  gasPrice: typeof tx.gasPrice === "string" ? tx.gasPrice : "0",
                  isUserTransaction: isUserTx,
                };
              })
            : [],
          timestamp:
            typeof data.timestamp === "string"
              ? data.timestamp
              : Date.now().toString(),
          gasLimit: typeof data.gasLimit === "string" ? data.gasLimit : "0",
          gasUsed: typeof data.gasUsed === "string" ? data.gasUsed : "0",
          parentHash:
            typeof data.parentHash === "string" ? data.parentHash : "",
          isFlashBlock: true,
        };

        const newFlashBlock = createGameBlock(blockData, true);

        // Double-check if the block contains the user's transaction
        if (
          userTxHash &&
          blockData.transactions.some((tx) => tx.isUserTransaction)
        ) {
          console.log(
            `Creating flash game block with user transaction: ${newFlashBlock.id}`
          );
        }

        // Use a function reference to avoid dependency on flashBlocks state
        setFlashBlocks((prev) => {
          // Limit the number of blocks to prevent performance issues
          const updatedBlocks = [...prev, newFlashBlock];
          return updatedBlocks.slice(-MAX_BLOCKS);
        });

        // Check if user transaction is in this block
        // Use refs instead of state for checking to avoid dependency cycles
        const isAlreadyConfirmed =
          gameStateRef.current.userTransactionConfirmedInFlash;

        if (
          userTxHash &&
          !isAlreadyConfirmed &&
          Array.isArray(data.transactions)
        ) {
          const userTxInBlock = data.transactions.some(
            (tx: Record<string, unknown>) =>
              tx && typeof tx.hash === "string" && tx.hash === userTxHash
          );

          if (userTxInBlock && transactionSubmitTimeRef.current) {
            const confirmationTime =
              Date.now() - transactionSubmitTimeRef.current;

            // Only update if this is the first confirmation or if it's faster
            if (
              lowestFlashConfirmationTimeRef.current === null ||
              confirmationTime < lowestFlashConfirmationTimeRef.current
            ) {
              lowestFlashConfirmationTimeRef.current = confirmationTime;
              flashConfirmationMethodRef.current = "websocket";

              console.log(
                `✅ [FLASH-WebSocket] Transaction confirmed after ${confirmationTime}ms (fastest so far)`
              );

              // Update game state without creating a dependency on it
              setGameState((prev) => ({
                ...prev,
                userTransactionConfirmedInFlash: true,
                flashConfirmationTime: confirmationTime,
              }));
            } else {
              console.log(
                `✅ [FLASH-WebSocket] Transaction confirmed after ${confirmationTime}ms (not the fastest)`
              );
            }
          }
        }
      }
    };

    const handleWebSocketError = (error: Event) => {
      console.error("WebSocket error:", error);
      wsConnectedRef.current = false;
    };

    const handleWebSocketOpen = () => {
      console.log("WebSocket connected");
      wsConnectedRef.current = true;

      // Clear the processed blocks set when reconnecting
      processedFlashBlocksRef.current.clear();
    };

    const handleWebSocketClose = () => {
      console.log("WebSocket closed");
      wsConnectedRef.current = false;

      // Try to reconnect after a delay
      setTimeout(() => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          console.log("Attempting to reconnect WebSocket...");
          setupWebSocket();
        }
      }, 3000);
    };

    const setupWebSocket = () => {
      if (wsRef.current) {
        wsRef.current.close();
      }

      wsRef.current = createFlashBlocksWebSocket(
        handleWebSocketMessage,
        handleWebSocketError
      );

      if (wsRef.current) {
        // Remove the custom onmessage handler since createFlashBlocksWebSocket already sets it
        wsRef.current.onopen = handleWebSocketOpen;
        wsRef.current.onclose = handleWebSocketClose;
        // The onerror handler is already set by createFlashBlocksWebSocket
      }
    };

    // Initial setup
    setupWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []); // Empty dependency array to run only once on mount

  // Fetch standard blocks at regular intervals
  useEffect(() => {
    const fetchStandardBlock = async () => {
      try {
        const block = await getLatestStandardBlock();

        // Check if we've already processed this block
        const blockId = `${block.number}-${block.hash}`;
        if (processedStandardBlocksRef.current.has(blockId)) {
          return;
        }

        // Mark this block as processed
        processedStandardBlocksRef.current.add(blockId);

        // Log the received standard block
        console.log(
          `Received standard block: ${block.number} with ${block.transactions.length} transactions`
        );

        // Get current user transaction hash
        const userTxHash = gameStateRef.current.userTransactionHash;

        // Mark user transactions
        if (userTxHash) {
          block.transactions = block.transactions.map((tx) => ({
            ...tx,
            isUserTransaction: tx.hash === userTxHash,
          }));
        }

        const newBlock = createGameBlock(block, false);
        setStandardBlocks((prev) => {
          // Limit the number of blocks to prevent performance issues
          const updatedBlocks = [...prev, newBlock];
          return updatedBlocks.slice(-MAX_BLOCKS);
        });

        // Check if user transaction is in this block
        // Use refs instead of state for checking to avoid dependency cycles
        const isAlreadyConfirmed =
          gameStateRef.current.userTransactionConfirmedInStandard;

        if (userTxHash && !isAlreadyConfirmed) {
          const userTxInBlock = block.transactions.some(
            (tx) => tx.hash === userTxHash
          );

          if (userTxInBlock && transactionSubmitTimeRef.current) {
            const confirmationTime =
              Date.now() - transactionSubmitTimeRef.current;

            // Only update if this is the first confirmation or if it's faster
            if (
              lowestStandardConfirmationTimeRef.current === null ||
              confirmationTime < lowestStandardConfirmationTimeRef.current
            ) {
              lowestStandardConfirmationTimeRef.current = confirmationTime;
              standardConfirmationMethodRef.current = "polling";

              console.log(
                `✅ [STANDARD-Polling] Transaction confirmed after ${confirmationTime}ms (fastest so far)`
              );

              // Update game state without creating a dependency on it
              setGameState((prev) => ({
                ...prev,
                userTransactionConfirmedInStandard: true,
                standardConfirmationTime: confirmationTime,
              }));
            } else {
              console.log(
                `✅ [STANDARD-Polling] Transaction confirmed after ${confirmationTime}ms (not the fastest)`
              );
            }
          }
        }
      } catch (error) {
        console.error("Error fetching standard block:", error);
      }
    };

    // Fetch a standard block immediately on mount
    fetchStandardBlock();

    const standardBlockInterval = setInterval(
      fetchStandardBlock,
      STANDARD_BLOCK_INTERVAL
    );

    return () => {
      clearInterval(standardBlockInterval);
    };
  }, []); // Empty dependency array to run only once on mount

  // Fetch flash blocks at regular intervals (fallback if WebSocket fails)
  useEffect(() => {
    const fetchFlashBlock = async () => {
      try {
        // Only fetch if WebSocket is not working
        if (!wsConnectedRef.current) {
          console.log("WebSocket not connected, using fallback");
          const block = await getLatestFlashBlock();

          // Check if we've already processed this block
          const blockId = `${block.number}-${block.hash}`;
          if (processedFlashBlocksRef.current.has(blockId)) {
            return;
          }

          // Mark this block as processed
          processedFlashBlocksRef.current.add(blockId);

          // Get current user transaction hash
          const userTxHash = gameStateRef.current.userTransactionHash;

          // Mark user transactions
          if (userTxHash) {
            block.transactions = block.transactions.map((tx) => ({
              ...tx,
              isUserTransaction: tx.hash === userTxHash,
            }));
          }

          const newBlock = createGameBlock(block, true);
          setFlashBlocks((prev) => {
            // Limit the number of blocks to prevent performance issues
            const updatedBlocks = [...prev, newBlock];
            return updatedBlocks.slice(-MAX_BLOCKS);
          });

          // Check if user transaction is in this block
          // Use refs instead of state for checking to avoid dependency cycles
          const isAlreadyConfirmed =
            gameStateRef.current.userTransactionConfirmedInFlash;

          if (userTxHash && !isAlreadyConfirmed) {
            const userTxInBlock = block.transactions.some(
              (tx) => tx.hash === userTxHash
            );

            if (userTxInBlock && transactionSubmitTimeRef.current) {
              const confirmationTime =
                Date.now() - transactionSubmitTimeRef.current;

              // Only update if this is the first confirmation or if it's faster
              if (
                lowestFlashConfirmationTimeRef.current === null ||
                confirmationTime < lowestFlashConfirmationTimeRef.current
              ) {
                lowestFlashConfirmationTimeRef.current = confirmationTime;
                flashConfirmationMethodRef.current = "polling";

                console.log(
                  `✅ [FLASH-Polling] Transaction confirmed after ${confirmationTime}ms (fastest so far)`
                );

                // Update game state without creating a dependency on it
                setGameState((prev) => ({
                  ...prev,
                  userTransactionConfirmedInFlash: true,
                  flashConfirmationTime: confirmationTime,
                }));
              } else {
                console.log(
                  `✅ [FLASH-Polling] Transaction confirmed after ${confirmationTime}ms (not the fastest)`
                );
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching flash block:", error);
      }
    };

    const flashBlockInterval = setInterval(
      fetchFlashBlock,
      FLASH_BLOCK_INTERVAL
    );

    return () => {
      clearInterval(flashBlockInterval);
    };
  }, []); // Empty dependency array to run only once on mount

  // Game loop for updating block positions and checking collisions
  useEffect(() => {
    const updateGame = () => {
      // Update standard blocks and track newly caught ones
      setStandardBlocks((prev) => {
        const updatedBlocks = prev.map((block) => {
          // Only update position if not caught
          if (block.caught) return block;

          const newY = block.y + block.speed;
          const newCaught = isCaught(block, catcher, gameHeight);

          // If newly caught, add to caught list
          if (newCaught && !block.caught) {
            setNewlyCaughtStandard((caught) => [
              ...caught,
              { ...block, caught: true },
            ]);
          }

          return {
            ...block,
            y: newY,
            caught: newCaught,
          };
        });

        // Keep blocks that are either caught or still on screen
        return updatedBlocks.filter(
          (block) => block.caught || block.y < gameHeight
        );
      });

      // Update flash blocks and track newly caught ones
      setFlashBlocks((prev) => {
        const updatedBlocks = prev.map((block) => {
          // Only update position if not caught
          if (block.caught) return block;

          const newY = block.y + block.speed;
          const newCaught = isCaught(block, catcher, gameHeight);

          // If newly caught, add to caught list
          if (newCaught && !block.caught) {
            setNewlyCaughtFlash((caught) => [
              ...caught,
              { ...block, caught: true },
            ]);
          }

          return {
            ...block,
            y: newY,
            caught: newCaught,
          };
        });

        // Keep blocks that are either caught or still on screen
        return updatedBlocks.filter(
          (block) => block.caught || block.y < gameHeight
        );
      });

      animationFrameRef.current = requestAnimationFrame(updateGame);
    };

    animationFrameRef.current = requestAnimationFrame(updateGame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [catcher, gameHeight]);

  // Update score based on newly caught blocks
  useEffect(() => {
    if (newlyCaughtStandard.length > 0) {
      setGameState((prev) => ({
        ...prev,
        score: prev.score + newlyCaughtStandard.length * POINTS_STANDARD_BLOCK,
        standardBlocksCaught:
          prev.standardBlocksCaught + newlyCaughtStandard.length,
      }));
      setNewlyCaughtStandard([]);
    }
  }, [newlyCaughtStandard]);

  useEffect(() => {
    if (newlyCaughtFlash.length > 0) {
      setGameState((prev) => ({
        ...prev,
        score: prev.score + newlyCaughtFlash.length * POINTS_FLASH_BLOCK,
        flashBlocksCaught: prev.flashBlocksCaught + newlyCaughtFlash.length,
      }));
      setNewlyCaughtFlash([]);
    }
  }, [newlyCaughtFlash]);

  // Handle catcher movement
  const moveCatcher = useCallback(
    (x: number) => {
      setCatcher((prev) => ({
        ...prev,
        x: Math.max(0, Math.min(gameWidth - prev.width, x)),
      }));
    },
    [gameWidth]
  );

  // Submit a transaction and track its confirmation
  const submitTransaction = useCallback(
    (txHash: string) => {
      const submitTime = Date.now();
      transactionSubmitTimeRef.current = submitTime;

      console.log(`Submitting transaction: ${txHash}`);

      // Store the transaction hash globally for easier access
      if (typeof window !== "undefined") {
        window.userTxHash = txHash;
      }

      // Update game state with the transaction hash
      setGameState((prev) => ({
        ...prev,
        userTransactionHash: txHash,
        standardConfirmationTime: null,
        flashConfirmationTime: null,
        userTransactionConfirmedInStandard: false,
        userTransactionConfirmedInFlash: false,
      }));

      // Reset confirmation method refs
      flashConfirmationMethodRef.current = null;
      standardConfirmationMethodRef.current = null;

      // Reset lowest confirmation time refs
      lowestFlashConfirmationTimeRef.current = null;
      lowestStandardConfirmationTimeRef.current = null;

      // Start actively checking for transaction confirmation in standard blocks immediately
      const checkStandardConfirmation = async () => {
        try {
          // Use gameStateRef to avoid dependency on gameState
          if (
            txHash &&
            !gameStateRef.current.userTransactionConfirmedInStandard
          ) {
            console.log(
              `[${
                Date.now() - submitTime
              }ms] Checking standard confirmation for: ${txHash}`
            );
            const isConfirmed = await checkTransactionConfirmation(
              txHash,
              false
            );

            if (isConfirmed && transactionSubmitTimeRef.current) {
              const confirmationTime =
                Date.now() - transactionSubmitTimeRef.current;

              // Only update if this is the first confirmation or if it's faster
              if (
                lowestStandardConfirmationTimeRef.current === null ||
                confirmationTime < lowestStandardConfirmationTimeRef.current
              ) {
                lowestStandardConfirmationTimeRef.current = confirmationTime;
                standardConfirmationMethodRef.current = "provider";

                console.log(
                  `✅ [STANDARD-Provider] Transaction confirmed after ${confirmationTime}ms (fastest so far)`
                );

                setGameState((prev) => ({
                  ...prev,
                  userTransactionConfirmedInStandard: true,
                  standardConfirmationTime: confirmationTime,
                }));
              } else {
                console.log(
                  `✅ [STANDARD-Provider] Transaction confirmed after ${confirmationTime}ms (not the fastest)`
                );
              }

              return true; // Stop checking
            }
            return false; // Continue checking
          }
          return true; // Stop checking if no txHash or already confirmed
        } catch (error) {
          console.error("Error checking standard confirmation:", error);
          return false; // Continue checking despite error
        }
      };

      // Check standard blocks using direct RPC
      const checkStandardConfirmationRPC = async () => {
        try {
          // Use gameStateRef to avoid dependency on gameState
          if (
            txHash &&
            !gameStateRef.current.userTransactionConfirmedInStandard
          ) {
            const isConfirmed = await checkStandardBlockConfirmationRPC(txHash);

            if (isConfirmed && transactionSubmitTimeRef.current) {
              const confirmationTime =
                Date.now() - transactionSubmitTimeRef.current;

              // Only update if this is the first confirmation or if it's faster
              if (
                lowestStandardConfirmationTimeRef.current === null ||
                confirmationTime < lowestStandardConfirmationTimeRef.current
              ) {
                lowestStandardConfirmationTimeRef.current = confirmationTime;
                standardConfirmationMethodRef.current = "rpc";

                console.log(
                  `✅ [STANDARD-RPC] Transaction confirmed after ${confirmationTime}ms (fastest so far)`
                );

                setGameState((prev) => ({
                  ...prev,
                  userTransactionConfirmedInStandard: true,
                  standardConfirmationTime: confirmationTime,
                }));
              } else {
                console.log(
                  `✅ [STANDARD-RPC] Transaction confirmed after ${confirmationTime}ms (not the fastest)`
                );
              }

              return true; // Stop checking
            }
            return false; // Continue checking
          }
          return true; // Stop checking if no txHash or already confirmed
        } catch (error) {
          console.error("Error checking standard confirmation via RPC:", error);
          return false; // Continue checking despite error
        }
      };

      // Start actively checking for transaction confirmation in flash blocks
      const checkFlashConfirmation = async () => {
        try {
          // Use gameStateRef to avoid dependency on gameState
          if (txHash && !gameStateRef.current.userTransactionConfirmedInFlash) {
            console.log(
              `[${
                Date.now() - submitTime
              }ms] Checking flash confirmation for: ${txHash}`
            );
            const isConfirmed = await checkTransactionConfirmation(
              txHash,
              true
            );

            if (isConfirmed && transactionSubmitTimeRef.current) {
              const confirmationTime =
                Date.now() - transactionSubmitTimeRef.current;

              // Only update if this is the first confirmation or if it's faster
              if (
                lowestFlashConfirmationTimeRef.current === null ||
                confirmationTime < lowestFlashConfirmationTimeRef.current
              ) {
                lowestFlashConfirmationTimeRef.current = confirmationTime;
                flashConfirmationMethodRef.current = "provider";

                console.log(
                  `✅ [FLASH-Provider] Transaction confirmed after ${confirmationTime}ms (fastest so far)`
                );

                setGameState((prev) => ({
                  ...prev,
                  userTransactionConfirmedInFlash: true,
                  flashConfirmationTime: confirmationTime,
                }));
              } else {
                console.log(
                  `✅ [FLASH-Provider] Transaction confirmed after ${confirmationTime}ms (not the fastest)`
                );
              }

              return false; // Continue checking to find potentially faster confirmations
            }
            return false; // Continue checking
          }
          return true; // Stop checking if no txHash or already confirmed
        } catch (error) {
          console.error("Error checking flash confirmation:", error);
          return false; // Continue checking despite error
        }
      };

      // Check flash blocks using direct RPC
      const checkFlashConfirmationRPC = async () => {
        try {
          // Use gameStateRef to avoid dependency on gameState
          if (txHash && !gameStateRef.current.userTransactionConfirmedInFlash) {
            const isConfirmed = await checkFlashBlockConfirmationRPC(txHash);

            if (isConfirmed && transactionSubmitTimeRef.current) {
              const confirmationTime =
                Date.now() - transactionSubmitTimeRef.current;

              // Only update if this is the first confirmation or if it's faster
              if (
                lowestFlashConfirmationTimeRef.current === null ||
                confirmationTime < lowestFlashConfirmationTimeRef.current
              ) {
                lowestFlashConfirmationTimeRef.current = confirmationTime;
                flashConfirmationMethodRef.current = "rpc";

                console.log(
                  `✅ [FLASH-RPC] Transaction confirmed after ${confirmationTime}ms (fastest so far)`
                );

                setGameState((prev) => ({
                  ...prev,
                  userTransactionConfirmedInFlash: true,
                  flashConfirmationTime: confirmationTime,
                }));
              } else {
                console.log(
                  `✅ [FLASH-RPC] Transaction confirmed after ${confirmationTime}ms (not the fastest)`
                );
              }

              return false; // Continue checking to find potentially faster confirmations
            }
            return false; // Continue checking
          }
          return true; // Stop checking if no txHash or already confirmed
        } catch (error) {
          console.error("Error checking flash confirmation via RPC:", error);
          return false; // Continue checking despite error
        }
      };

      // Check standard blocks every 1000ms for 60 seconds using provider
      const standardCheckInterval = setInterval(async () => {
        const shouldStop = await checkStandardConfirmation();
        if (shouldStop) {
          clearInterval(standardCheckInterval);
        }
      }, 1000);

      // Check standard blocks every 800ms for 60 seconds using RPC
      const standardRPCCheckInterval = setInterval(async () => {
        const shouldStop = await checkStandardConfirmationRPC();
        if (shouldStop) {
          clearInterval(standardRPCCheckInterval);
        }
      }, 800);

      // Start checking flash blocks immediately using both methods
      console.log("Starting flash block confirmation checks...");

      // Check flash blocks every 200ms for 30 seconds using provider
      const flashCheckInterval = setInterval(async () => {
        const shouldStop = await checkFlashConfirmation();
        if (shouldStop) {
          clearInterval(flashCheckInterval);
        }
      }, 200);

      // Check flash blocks every 100ms for 30 seconds using RPC
      const flashRPCCheckInterval = setInterval(async () => {
        const shouldStop = await checkFlashConfirmationRPC();
        if (shouldStop) {
          clearInterval(flashRPCCheckInterval);
        }
      }, 100);

      // Clear flash intervals after 30 seconds
      setTimeout(() => {
        clearInterval(flashCheckInterval);
        clearInterval(flashRPCCheckInterval);

        if (!gameStateRef.current.userTransactionConfirmedInFlash) {
          console.log("⚠️ Flash confirmation check timed out after 30 seconds");
        } else {
          console.log(
            `Flash confirmation method used: ${flashConfirmationMethodRef.current}`
          );
        }
      }, 30000);

      // Clear standard intervals after 60 seconds
      setTimeout(() => {
        clearInterval(standardCheckInterval);
        clearInterval(standardRPCCheckInterval);

        if (!gameStateRef.current.userTransactionConfirmedInStandard) {
          console.log(
            "⚠️ Standard confirmation check timed out after 60 seconds"
          );
        } else {
          console.log(
            `Standard confirmation method used: ${standardConfirmationMethodRef.current}`
          );
        }
      }, 60000);
    },
    [] // No dependencies needed since we use refs
  );

  // Helper function to create a game block from blockchain data
  function createGameBlock(blockData: Block, isFlashBlock: boolean): GameBlock {
    const speed = isFlashBlock ? 3 : 2;
    const width = isFlashBlock ? BLOCK_WIDTH * 0.8 : BLOCK_WIDTH;
    const height = isFlashBlock ? BLOCK_HEIGHT * 0.8 : BLOCK_HEIGHT;

    // Generate a truly unique ID by adding a random component
    const uniqueId = `${isFlashBlock ? "flash" : "standard"}-${
      blockData.number
    }-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Check if the block contains the user's transaction
    const hasUserTransaction = blockData.transactions.some(
      (tx) => tx.isUserTransaction
    );
    if (hasUserTransaction) {
      console.log(
        `Block ${blockData.number} contains user transaction. Creating block with ID: ${uniqueId}`
      );
    }

    return {
      id: uniqueId,
      blockNumber: blockData.number,
      hash: blockData.hash,
      transactionCount: blockData.transactions.length,
      isFlashBlock,
      x: Math.random() * (gameWidth - width),
      y: -height,
      width,
      height,
      speed,
      caught: false,
      details: blockData,
    };
  }

  // Helper function to check if a block is caught by the catcher
  function isCaught(
    block: GameBlock,
    catcher: CatcherState,
    gameHeight: number
  ): boolean {
    const blockBottom = block.y + block.height;
    const catcherTop = gameHeight - CATCHER_HEIGHT - 10; // Adjust for the bottom margin

    return (
      blockBottom >= catcherTop &&
      block.x + block.width > catcher.x &&
      block.x < catcher.x + catcher.width &&
      !block.caught
    );
  }

  return {
    gameState,
    standardBlocks,
    flashBlocks,
    catcher,
    gameWidth,
    gameHeight,
    moveCatcher,
    submitTransaction,
    CATCHER_HEIGHT,
    STANDARD_BLOCK_COLOR,
    FLASH_BLOCK_COLOR,
  };
}
