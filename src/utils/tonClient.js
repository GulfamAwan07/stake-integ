import { TonClient } from "@ton/ton";
import { Address, beginCell, toNano } from "@ton/core";

export const STAKING_CONTRACT =
  "kQD2y9eUotYw7VprrD0UJvAigDVXwgCCLWAl-DjaamCHniVr";
export const STAKE_OPCODE = 0x47d54391;
export const UNSTAKE_OPCODE = 0x595f07bc;

export const tonClient = new TonClient({
  endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
});

export async function getTonBalance(userAddress) {
  const balance = await tonClient.getBalance(Address.parse(userAddress));
  return Number(balance) / 1e9;
}

// tonClient.js - use tonapi instead of get_methods
export async function getJettonWallet(userAddress) {
  const res = await fetch(
    `https://testnet.tonapi.io/v2/accounts/${userAddress}/jettons`,
  );
  const data = await res.json();
  console.log("Jettons:", data); // share this output
  return data;
}

export async function getStakedBalance(jettonWalletAddress) {
  const result = await tonClient.runMethod(
    jettonWalletAddress, // already an Address from readAddress()
    "get_wallet_data",
  );
  const balance = result.stack.readBigNumber();
  return Number(balance) / 1e9;
}

export function buildStakePayload() {
  return beginCell().storeUint(STAKE_OPCODE, 32).storeUint(0, 64).endCell();
}

export function buildUnstakePayload(amount) {
  return beginCell()
    .storeUint(UNSTAKE_OPCODE, 32)
    .storeUint(0, 64)
    .storeCoins(toNano(amount))
    .endCell();
}
