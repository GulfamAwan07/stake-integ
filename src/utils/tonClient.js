// src/utils/tonClient.js

import { TonClient } from "@ton/ton";
import { Address, beginCell, toNano } from "@ton/core";

export const STAKING_CONTRACT =
  "kQDGATLLt9nXRC680Vhe_YaLot1KHtknjS5_fa_QhYrjwvPT"; // your testnet address

// ⚠️ REPLACE WITH REAL OPCODES FROM CONTRACT
export const STAKE_OPCODE = 0x47d54391;
export const UNSTAKE_OPCODE = 0x595f07bc;

export const tonClient = new TonClient({
  endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
});

export async function getTonBalance(userAddress) {
  const balance = await tonClient.getBalance(Address.parse(userAddress));

  return Number(balance) / 1e9; // nanoTON → TON
}

export async function getJettonWallet(userAddress) {
  const result = await tonClient.runMethod(
    Address.parse(STAKING_CONTRACT),
    "get_wallet_address",
    [
      {
        type: "slice",
        cell: beginCell().storeAddress(Address.parse(userAddress)).endCell(),
      },
    ],
  );

  return result.stack.readAddress();
}

export async function getStakedBalance(jettonWalletAddress) {
  const result = await tonClient.runMethod(
    Address.parse(jettonWalletAddress),
    "get_wallet_data",
  );

  const balance = result.stack.readBigNumber();
  return Number(balance) / 1e9;
}

export function buildStakePayload(amount) {
  return beginCell()
    .storeUint(STAKE_OPCODE, 32)
    .storeCoins(toNano(amount))
    .endCell();
}

export function buildUnstakePayload(amount) {
  return beginCell()
    .storeUint(UNSTAKE_OPCODE, 32)
    .storeCoins(toNano(amount))
    .endCell();
}
