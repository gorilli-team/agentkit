import { CdpAction } from "./cdp_action";
import { Wallet } from "@coinbase/coinbase-sdk"; // Import Coinbase Wallet class
import { Decimal } from "decimal.js";
import { z } from "zod";

// Contract addresses
const VAULT_ADDRESS = "0xc6827ce6d60a13a20a86dcac8c9e6d0f84497345";
const BRETT_ADDRESS = "0x532f27101965dd16442e59d40670faf5ebb142e4";
const USDC_ADDRESS = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";

// Define the action's descriptive prompt
const MEME_TRADE_PROMPT = `
This tool executes trades in the Gorillionaire Vault on Base network.
- For SELL: Sells BRETT to get USDC
- For BUY: Sells USDC to get BRETT
The tool handles the proper token routing and minimum output calculations.
`;

// Define the input schema using Zod
const GorilliMemeTradeInput = z.object({
  action: z.enum(["BUY", "SELL"]).describe("Trading action. Must be either 'BUY' or 'SELL'"),
  amountIn: z.string().describe("Amount of input tokens to trade (in base units)"),
  slippagePercentage: z
    .number()
    .min(0.1)
    .max(100)
    .describe("Maximum allowed slippage percentage (e.g., 1.0 for 1%)"),
});

/**
 * Executes a Gorilli Meme trade between two tokens.
 *
 * This function initiates a trade in the Gorillionaire Vault, allowing the user to either buy or sell a specific token.
 * The function calculates the minimum amount out based on the slippage percentage, sets a deadline for the transaction,
 * and then invokes the contract to execute the trade.
 *
 * @param {Wallet} wallet - The wallet instance that will be used to invoke the contract.
 * @param {object} args - The arguments for executing the trade.
 * @param {"BUY" | "SELL"} args.action - The action to perform, either "BUY" or "SELL".
 * @param {string} args.amountIn - The amount of input tokens for the trade.
 * @param {number} args.slippagePercentage - The slippage percentage to tolerate when performing the trade.
 *
 * @returns {Promise<string>} - A promise that resolves to a message indicating success or failure of the trade.
 *                               If successful, it includes the transaction hash, input amount, and minimum output amount.
 *                               If there is an error, it returns an error message.
 */
export async function gorilliMemeTrade(
  wallet: Wallet,
  args: { action: "BUY" | "SELL"; amountIn: string; slippagePercentage: number },
): Promise<string> {
  // Extract arguments for readability
  const { action, amountIn, slippagePercentage } = args;

  // Determine the token to trade out
  const tokenOut = action === "BUY" ? BRETT_ADDRESS : USDC_ADDRESS;

  // Set the transaction deadline (10 minutes from now)
  const deadline = Math.floor(Date.now() / 1000) + 600;

  // Calculate the minimum amount out based on the slippage
  const minAmountOut = BigInt(Math.floor(Number(amountIn) * (1 - slippagePercentage / 100)));

  try {
    // Prepare the contract invocation parameters
    const invocation = await wallet.invokeContract({
      contractAddress: VAULT_ADDRESS,
      method: "executeTrade",
      args: [tokenOut, amountIn, minAmountOut, deadline],
      abi: [
        {
          inputs: [
            { internalType: "address", name: "tokenOut", type: "address" },
            { internalType: "uint256", name: "amountIn", type: "uint256" },
            { internalType: "uint256", name: "minAmountOut", type: "uint256" },
            { internalType: "uint256", name: "deadline", type: "uint256" },
          ],
          name: "executeTrade",
          outputs: [],
          stateMutability: "external",
          type: "function",
        },
      ],
      amount: new Decimal(amountIn), // Send the amount as a Decimal (optional depending on contract)
      assetId: "eth", // Use the assetId depending on your contract (could be token or ETH)
    });

    // Wait for the transaction to be mined
    await invocation.wait();

    // Return success message with the transaction hash
    return `Successfully executed ${action} trade. Transaction hash: ${invocation.getTransactionHash()}. Input amount: ${amountIn}, Minimum output amount: ${minAmountOut}`;
  } catch (error) {
    // Catch and return any errors during the execution
    return `Error executing trade: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

/**
 * Gorilli Trade action.
 */
export class GorilliMemeTradeAction implements CdpAction<typeof GorilliMemeTradeInput> {
  public name = "gorilli_trade_meme";
  public description = MEME_TRADE_PROMPT;
  public argsSchema = GorilliMemeTradeInput;
  public func = gorilliMemeTrade;
}
