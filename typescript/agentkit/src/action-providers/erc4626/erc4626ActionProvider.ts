import { Wallet, Contract } from "@coinbase/coinbase-sdk";
import { CdpWrapper } from "@coinbase/cdp-agentkit-core";
import { CdpTool } from "@coinbase/cdp-langchain";
import { z } from "zod";

// ABI for ERC-4626 standard functions
const ERC4626_ABI = [
  "function deposit(uint256 assets, address receiver) returns (uint256 shares)",
  "function withdraw(uint256 assets, address receiver, address owner) returns (uint256 shares)",
  "function balanceOf(address owner) view returns (uint256)",
  "function totalAssets() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function previewDeposit(uint256 assets) view returns (uint256)",
  "function previewWithdraw(uint256 assets) view returns (uint256)",
  "function asset() view returns (address)"
];

// Define supported actions
const VAULT_ACTIONS = [
  'deposit',
  'withdraw',
  'balance',
  'previewDeposit',
  'previewWithdraw',
  'totalAssets',
  'totalSupply'
] as const;

// Define the action's descriptive prompt
const VAULT_INTERACTION_PROMPT = `
This tool enables interaction with ERC-4626 compliant vault contracts, supporting operations like:
- Depositing assets into the vault
- Withdrawing assets from the vault
- Checking balances and previewing conversions
- Querying vault metadata (total assets, total shares)

The vault follows the ERC-4626 tokenized vault standard, ensuring consistent behavior across different implementations.
`;

// Define the input schema using Zod
const VaultActionInput = z.object({
  vault_address: z.string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .describe("The Ethereum address of the ERC-4626 vault. e.g. '0x1234...'"),
  rpc_url: z.string()
    .url()
    .describe("The RPC endpoint URL for blockchain connection. e.g. 'https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY'"),
  action: z.enum(VAULT_ACTIONS)
    .describe("The type of vault interaction to perform. e.g. 'deposit', 'withdraw', 'balance'"),
  amount: z.number()
    .optional()
    .describe("The amount of tokens to deposit/withdraw (in base units). Required for deposit/withdraw/preview actions."),
  user_address: z.string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional()
    .describe("The user's wallet address. Required for balance queries and transactions.")
});

/**
 * Interacts with an ERC-4626 vault contract to perform various operations
 *
 * @param wallet - The wallet instance used for signing transactions
 * @param vault_address - The address of the ERC-4626 vault contract
 * @param rpc_url - RPC endpoint URL for blockchain connection
 * @param action - The type of interaction to perform
 * @param amount - Optional amount for deposit/withdraw operations
 * @param user_address - Optional user address for balance queries and transactions
 * @returns A string containing the operation result (transaction hash, balance, or preview calculation)
 */
async function vaultInteraction(
  wallet: Wallet,
  vault_address: string,
  rpc_url: string,
  action: typeof VAULT_ACTIONS[number],
  amount?: number,
  user_address?: string
): Promise<string> {
  try {
    // Create contract instance
    const vaultContract = new Contract(vault_address, ERC4626_ABI, wallet);

    // Handle different actions
    switch (action) {
      case 'deposit':
        if (!amount || !user_address) {
          throw new Error("Amount and user address required for deposits");
        }
        const depositTx = await vaultContract.deposit(amount, user_address);
        return `Deposit transaction submitted: ${depositTx.hash}`;

      case 'withdraw':
        if (!amount || !user_address) {
          throw new Error("Amount and user address required for withdrawals");
        }
        const withdrawTx = await vaultContract.withdraw(amount, user_address, user_address);
        return `Withdrawal transaction submitted: ${withdrawTx.hash}`;

      case 'balance':
        if (!user_address) {
          throw new Error("User address required for balance queries");
        }
        const balance = await vaultContract.balanceOf(user_address);
        return `User vault share balance: ${balance.toString()}`;

      case 'previewDeposit':
        if (!amount) {
          throw new Error("Amount required for deposit preview");
        }
        const shares = await vaultContract.previewDeposit(amount);
        return `Expected shares for deposit: ${shares.toString()}`;

      case 'previewWithdraw':
        if (!amount) {
          throw new Error("Amount required for withdrawal preview");
        }
        const assets = await vaultContract.previewWithdraw(amount);
        return `Expected assets for withdrawal: ${assets.toString()}`;

      case 'totalAssets':
        const totalAssets = await vaultContract.totalAssets();
        return `Total assets in vault: ${totalAssets.toString()}`;

      case 'totalSupply':
        const totalSupply = await vaultContract.totalSupply();
        return `Total vault shares in circulation: ${totalSupply.toString()}`;

      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific error cases
      if (error.message.includes("insufficient balance")) {
        return "Error: Insufficient balance for the requested operation";
      }
      if (error.message.includes("gas required exceeds allowance")) {
        return "Error: Transaction would fail - gas estimation failed";
      }
      if (error.message.includes("network")) {
        return "Error: RPC connection failed - please check your connection and try again";
      }
      // Return the actual error message for other cases
      return `Error: ${error.message}`;
    }
    return "An unknown error occurred";
  }
}

// Create the CdpTool instance
const vaultInteractionTool = new CdpTool(
  {
    name: "vault_interaction",
    description: VAULT_INTERACTION_PROMPT,
    argsSchema: VaultActionInput,
    func: vaultInteraction
  },
  agentkit
);

// Add the tool to your toolkit
tools.push(vaultInteractionTool);