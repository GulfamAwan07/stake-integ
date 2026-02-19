// tonClient.js

import { TonClient } from "@ton/ton";
import { Address, beginCell, toNano } from "@ton/core";

export const STAKING_CONTRACT =
  "kQD2y9eUotYw7VprrD0UJvAigDVXwgCCLWAl-DjaamCHniVr";
export const STAKE_OPCODE = 0x47d54391;
export const UNSTAKE_OPCODE = 0x595f07bc;
export const PARTNER_CODE = 0x0000000074746f6e;

export const tonClient = new TonClient({
  endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
});

export async function getTonBalance(userAddress) {
  const balance = await tonClient.getBalance(Address.parse(userAddress));
  return Number(balance) / 1e9;
}

// tonClient.js - fix getJettonWallet to return both wallet address and data
export async function getJettonWallet(userAddress) {
  const res = await fetch(
    `https://testnet.tonapi.io/v2/accounts/${userAddress}/jettons`,
  );
  const data = await res.json();
  return data; // keeps getStakedBalance working as before
}

// ✅ single clean function for getting the TUNA jetton wallet address string
export async function getTunaJettonWalletAddress(userAddress) {
  const res = await fetch(
    `https://testnet.tonapi.io/v2/accounts/${userAddress}/jettons`,
  );
  const data = await res.json();

  const tuna = data.balances?.find(
    (b) => b.jetton?.symbol?.toUpperCase() === "TUNA",
  );

  const rawAddress = tuna?.wallet_address?.address;
  if (!rawAddress) return null;

  return Address.parse(rawAddress).toString();
}

export async function getStakedBalance(jettonData) {
  if (!jettonData?.balances?.length) return 0;
  const tuna = jettonData.balances.find(
    (b) => b.jetton?.symbol?.toUpperCase() === "TUNA",
  );
  if (!tuna) return 0;
  return Number(tuna.balance) / 1e9;
}

export function buildStakePayload() {
  return beginCell()
    .storeUint(STAKE_OPCODE, 32)
    .storeUint(0, 64)
    .storeUint(PARTNER_CODE, 64)
    .endCell();
}

const getUserJettonWalletAddress = async (userAddress) => {
  const res = await fetch(
    `https://testnet.tonapi.io/v2/accounts/${userAddress}/jettons`,
  );
  const data = await res.json();

  const tuna = data.balances?.find(
    (b) =>
      b.jetton?.symbol?.toUpperCase() === "UKWNAM" ||
      b.jetton?.symbol?.toUpperCase() === "TUNA",
  );

  console.log(
    "All jettons:",
    data.balances?.map((b) => b.jetton?.symbol),
  );
  console.log("Raw wallet address:", tuna?.wallet_address?.address);

  // ✅ Convert to user-friendly format
  const rawAddress = tuna?.wallet_address?.address;
  if (!rawAddress) return null;

  return Address.parse(rawAddress).toString(); // converts to EQ.../kQ... format
};

export function buildUnstakePayload(amount) {
  // forward_payload with unstake opcode
  const forwardPayload = beginCell()
    .storeUint(UNSTAKE_OPCODE, 32) // 0x595f07bc
    .storeUint(0, 64) // query_id
    .endCell();

  // Jetton Transfer message (TEP-74)
  return beginCell()
    .storeUint(0xf8a7ea5, 32) // transfer opcode
    .storeUint(0, 64) // query_id
    .storeCoins(toNano(amount)) // jetton amount to send back
    .storeAddress(Address.parse(STAKING_CONTRACT)) // destination = staking contract
    .storeAddress(Address.parse(STAKING_CONTRACT)) // response_destination
    .storeMaybeRef(null) // custom_payload
    .storeCoins(toNano("0.05")) // forward_ton_amount
    .storeMaybeRef(forwardPayload) // forward_payload with unstake op
    .endCell();
}
