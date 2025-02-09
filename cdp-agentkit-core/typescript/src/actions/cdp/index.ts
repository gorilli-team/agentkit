import { CdpAction, CdpActionSchemaAny } from "./cdp_action";
import { DeployNftAction } from "./deploy_nft";
import { DeployTokenAction } from "./deploy_token";
import { GetBalanceAction } from "./get_balance";
import { GetWalletDetailsAction } from "./get_wallet_details";
import { MintNftAction } from "./mint_nft";
import { RegisterBasenameAction } from "./register_basename";
import { RequestFaucetFundsAction } from "./request_faucet_funds";
import { TradeAction } from "./trade";
import { TransferAction } from "./transfer";
import { WrapEthAction } from "./wrap_eth";
import { WOW_ACTIONS } from "./defi/wow";
import { CreateERC4626VaultAction } from "./gorilli_create_vault";
import { GorilliTradeAction } from "./gorilli_trade";
import { GorilliMemeTradeAction } from "./gorilli_trade_meme";

/**
 * Retrieves all CDP action instances.
 * WARNING: All new CdpAction classes must be instantiated here to be discovered.
 *
 * @returns - Array of CDP action instances
 */
export function getAllCdpActions(): CdpAction<CdpActionSchemaAny>[] {
  const CDP_ACTIONS = [
    new GetWalletDetailsAction(),
    new DeployNftAction(),
    new DeployTokenAction(),
    new GetBalanceAction(),
    new MintNftAction(),
    new RegisterBasenameAction(),
    new RequestFaucetFundsAction(),
    new TradeAction(),
    new TransferAction(),
    new WrapEthAction(),
    new CreateERC4626VaultAction(),
    new GorilliTradeAction(),
    new GorilliMemeTradeAction(),
  ];

  console.log("RETRIEVED CDP_ACTIONS", CDP_ACTIONS);
  return CDP_ACTIONS;
}

export const CDP_ACTIONS = getAllCdpActions().concat(WOW_ACTIONS);

export {
  CdpAction,
  CdpActionSchemaAny,
  GetWalletDetailsAction,
  DeployNftAction,
  DeployTokenAction,
  GetBalanceAction,
  MintNftAction,
  RegisterBasenameAction,
  RequestFaucetFundsAction,
  TradeAction,
  TransferAction,
  WrapEthAction,
  CreateERC4626VaultAction,
  GorilliTradeAction,
};
