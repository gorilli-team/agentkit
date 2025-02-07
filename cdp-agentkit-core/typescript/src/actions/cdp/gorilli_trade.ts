import { CdpAction } from "./cdp_action";
import { Wallet, Amount } from "@coinbase/coinbase-sdk";
import { z } from "zod";

const GORILLI_TRADE_PROMPT = `
This tool will trade a specified amount of a 'from asset' to a 'to asset' for the wallet.

It takes the following inputs:
- The amount of the 'from asset' to trade
- The from asset ID to trade 
- The asset ID to receive from the trade

- if brett use the contract 0x532f27101965dd16442e59d40670faf5ebb142e4
- use usdc or eth to pay it

Important notes:
- Trades are only supported on mainnet networks (ie, 'base-mainnet', 'base', 'ethereum-mainnet', 'ethereum', etc.)
- Never allow trades on any non-mainnet network (ie, 'base-sepolia', 'ethereum-sepolia', etc.)
- When selling a native asset (e.g. 'eth' on base-mainnet), ensure there is sufficient balance to pay for the trade AND the gas cost of this trade
`;

/**
 * Input schema for gorilli trade action.
 */
export const GorilliTradeInput = z
  .object({
    amount: z.custom<Amount>().describe("The amount of the from asset to trade"),
    fromAssetId: z.string().describe("The from asset ID to trade"),
    toAssetId: z.string().describe("The to asset ID to receive from the trade"),
  })
  .strip()
  .describe("Instructions for trading assets");

/**
 * Trades a specified amount of a from asset to a to asset for the wallet.
 *
 * @param wallet - The wallet to trade the asset from.
 * @param args - The input arguments for the action.
 * @returns A message containing the trade details.
 */
export async function gorilli_trade(
  wallet: Wallet,
  args: z.infer<typeof GorilliTradeInput>,
): Promise<string> {
  try {
    const tradeResult = await wallet.createTrade({
      amount: args.amount,
      fromAssetId: args.fromAssetId,
      toAssetId: args.toAssetId,
    });

    const result = await tradeResult.wait();

    return `Gorilli - Traded ${args.amount} of ${args.fromAssetId} for ${result.getToAmount()} of ${args.toAssetId}.\nTransaction hash for the trade: ${result.getTransaction().getTransactionHash()}\nTransaction link for the trade: ${result.getTransaction().getTransactionLink()}`;
  } catch (error) {
    return `Error trading assets: ${error}`;
  }
}

/**
 * Gorilli Trade action.
 */
export class GorilliTradeAction implements CdpAction<typeof GorilliTradeInput> {
  public name = "gorilli_trade";
  public description = GORILLI_TRADE_PROMPT;
  public argsSchema = GorilliTradeInput;
  public func = gorilli_trade;
}
