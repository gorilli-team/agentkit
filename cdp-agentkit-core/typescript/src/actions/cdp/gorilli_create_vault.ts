import { CdpAction } from "./cdp_action";
import { z } from "zod";

const CREATE_VAULT_PROMPT = `
This tool allows users to create an ERC-4626 vault. ERC-4626 is a tokenized vault standard for yield-bearing assets in DeFi. Use this tool when a user needs to deploy a new vault for managing assets efficiently.
`;

/**
 * Input schema for creating an ERC-4626 vault.
 */
export const CreateVaultInput = z
  .object({
    name: z.string().describe("The name of the vault. e.g. 'My DeFi Vault'"),
    symbol: z.string().describe("The symbol for the vault token. e.g. 'MDV'"),
    assetAddress: z
      .string()
      .refine(val => /^0x[a-fA-F0-9]{40}$/.test(val), {
        message: "Invalid Ethereum address format",
      })
      .describe("The address of the underlying ERC-20 asset"),
    feeRecipient: z
      .string()
      .refine(val => /^0x[a-fA-F0-9]{40}$/.test(val), {
        message: "Invalid Ethereum address format",
      })
      .describe("The address that will receive fees from the vault."),
    depositFee: z
      .number()
      .min(0, { message: "Deposit fee cannot be less than 0" })
      .max(100, { message: "Deposit fee cannot be more than 100" })
      .describe("The percentage deposit fee (0-100)."),
    withdrawalFee: z
      .number()
      .min(0, { message: "Withdrawal fee cannot be less than 0" })
      .max(100, { message: "Withdrawal fee cannot be more than 100" })
      .describe("The percentage withdrawal fee (0-100)."),
  })
  .strip()
  .describe("Instructions for creating an ERC-4626 vault");

/**
 * Creates an ERC-4626 vault.
 *
 * @param args The input parameters for creating the vault
 * @param args.name The name of the vault
 * @param args.symbol The symbol for the vault token
 * @param args.assetAddress The address of the underlying ERC-20 asset
 * @param args.feeRecipient The address that will receive fees from the vault
 * @param args.depositFee The percentage deposit fee (0-100)
 * @param args.withdrawalFee The percentage withdrawal fee (0-100)
 * @returns A confirmation message containing the vault address.
 */
export async function createERC4626Vault(args: z.infer<typeof CreateVaultInput>): Promise<string> {
  try {
    // Simulate the vault creation process and return a mock response
    const { name, symbol, assetAddress, feeRecipient, depositFee, withdrawalFee } = args;

    // Returning a mock success message for now
    return `Successfully created ERC-4626 Vault:
      Name: ${name}
      Symbol: ${symbol}
      Asset Address: ${assetAddress}
      Fee Recipient: ${feeRecipient}
      Deposit Fee: ${depositFee}%
      Withdrawal Fee: ${withdrawalFee}%`;
  } catch (error) {
    throw new Error(`Failed to deploy ERC-4626 Vault'}`);
  }
}

/**
 * Create ERC-4626 Vault action.
 */
export class CreateERC4626VaultAction implements CdpAction<typeof CreateVaultInput> {
  public name = "gorilli_create_erc4626_vault";
  public description = CREATE_VAULT_PROMPT;
  public argsSchema = CreateVaultInput;
  public func = createERC4626Vault;
}
