import { CdpAction } from "./cdp_action";
import { z } from "zod";
import { ethers } from "ethers";
import ERC4626VaultABI from "../../ERC4626VaultABI.json";

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
 * @param args - The input parameters for creating the vault
 * @returns A confirmation message containing the vault address.
 */
export async function createERC4626Vault(args: z.infer<typeof CreateVaultInput>): Promise<string> {
  try {
    const { name, symbol, assetAddress, feeRecipient, depositFee, withdrawalFee } = args;

    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("PRIVATE_KEY environment variable is not set");
    }
    const wallet = new ethers.Wallet(privateKey, provider);

    // Define contract factory and deploy vault
    const VaultFactory = new ethers.ContractFactory(
      ERC4626VaultABI.abi,
      ERC4626VaultABI.bytecode,
      wallet,
    );
    const vault = await VaultFactory.deploy(
      assetAddress,
      name,
      symbol,
      feeRecipient,
      depositFee,
      withdrawalFee,
    );
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();

    return `Successfully deployed ERC-4626 Vault:
      Name: ${name}
      Symbol: ${symbol}
      Vault Address: ${vaultAddress}
      Asset Address: ${assetAddress}
      Fee Recipient: ${feeRecipient}
      Deposit Fee: ${depositFee}%
      Withdrawal Fee: ${withdrawalFee}%`;
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to deploy ERC-4626 Vault: ${errorMessage}`);
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
