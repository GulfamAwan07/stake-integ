import React, { useState, useEffect } from "react";
import { BiWalletAlt } from "react-icons/bi";
import { LuArrowDownUp } from "react-icons/lu";
import { FaGasPump } from "react-icons/fa";
import { MdKeyboardArrowDown } from "react-icons/md";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { toNano } from "@ton/core";
import {
  getTonBalance,
  getJettonWallet,
  getStakedBalance,
  buildStakePayload,
  buildUnstakePayload,
  STAKING_CONTRACT,
} from "../utils/tonClient";

const Staking = () => {
  const [swap, setSwap] = useState(false);
  const [amount, setAmount] = useState("");
  const [tonBalance, setTonBalance] = useState(0);
  const [stakedBalance, setStakedBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  const [tonConnectUI] = useTonConnectUI();
  const wallet = tonConnectUI.wallet;
  const userAddress = wallet?.account?.address;

  const handleConnect = async () => {
    try {
      await tonConnectUI.openModal(); // opens TON wallet modal
    } catch (e) {
      console.error("Wallet connection error:", e);
    }
  };
  /* =========================
     LOAD BALANCES
  ========================== */
  const loadBalances = async () => {
    if (!userAddress) return;

    try {
      const tonBal = await getTonBalance(userAddress);
      setTonBalance(tonBal);

      const jettonWallet = await getJettonWallet(userAddress);
      const staked = await getStakedBalance(jettonWallet);
      setStakedBalance(staked);
    } catch (e) {
      console.log("Balance load error:", e);
      setStakedBalance(0);
    }
  };

  useEffect(() => {
    loadBalances();
  }, [userAddress]);

  /* =========================
     HANDLE STAKE
  ========================== */
  const handleStake = async () => {
    if (!amount || !wallet) return;

    try {
      setLoading(true);

      const payload = buildStakePayload(amount);

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [
          {
            address: STAKING_CONTRACT,
            amount: toNano(amount).toString(),
            payload: payload.toBoc().toString("base64"),
          },
        ],
      });

      setAmount("");

      // wait for blockchain update
      setTimeout(loadBalances, 4000);
    } catch (err) {
      console.error("Stake error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     HANDLE UNSTAKE
  ========================== */
  const handleUnstake = async () => {
    if (!amount || !wallet) return;

    try {
      setLoading(true);

      const payload = buildUnstakePayload(amount);

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [
          {
            address: STAKING_CONTRACT,
            amount: toNano(amount).toString(),
            payload: payload.toBoc().toString("base64"),
          },
        ],
      });

      setAmount("");

      setTimeout(loadBalances, 4000);
    } catch (err) {
      console.error("Unstake error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center pt-12 flex-col">
      <button
        onClick={handleConnect}
        className="bg-gradient-to-r from-red-600 to-blue-600 text-white font-bold py-2 px-4 rounded-2xl mb-4"
      >
        Connect Wallet
      </button>
      {/* Toggle */}
      <div className="bg-[#2C2C2C] w-full max-w-[19rem] md:max-w-[35rem] mt-6 md:mt-10 h-12 flex flex-row justify-center items-center rounded-3xl p-1">
        <button
          onClick={() => setSwap(false)}
          className={`${
            !swap ? "bg-gradient-to-r from-red-600 to-blue-600" : "bg-[#2C2C2C]"
          } text-white font-bold w-1/2 h-10 rounded-3xl`}
        >
          Stake
        </button>

        <button
          onClick={() => setSwap(true)}
          className={`${
            swap ? "bg-gradient-to-r from-blue-600 to-red-600" : "bg-[#2C2C2C]"
          } text-white font-bold w-1/2 h-10 rounded-3xl`}
        >
          Unstake
        </button>
      </div>

      {/* Card */}
      <div className="mt-5 w-full max-w-[19rem] md:max-w-[35rem] bg-[#16161D] rounded-2xl p-6">
        {/* Balance Display */}
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>TON Balance: {tonBalance}</span>
          <span>KTON Balance: {stakedBalance}</span>
        </div>

        {/* Input */}
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          type="number"
          className="text-3xl font-bold bg-transparent outline-none text-gray-300 w-full mb-4"
        />

        {/* Max Button */}
        <button
          onClick={() =>
            setAmount(swap ? stakedBalance.toString() : tonBalance.toString())
          }
          className="text-sm text-white bg-gradient-to-r from-red-600 to-blue-600 rounded-full px-4 py-1 mb-4"
        >
          Max
        </button>

        {/* Action Button */}
        <button
          onClick={swap ? handleUnstake : handleStake}
          disabled={loading}
          className="w-full bg-gradient-to-r from-red-600 to-blue-600 text-white font-bold py-3 rounded-2xl"
        >
          {loading ? "Processing..." : swap ? "Unstake" : "Stake"}
        </button>

        {/* Gas Info */}
        <div className="flex justify-between w-full mt-4 text-xs text-gray-400">
          <span>1 TON ≈ 0.999 KTON</span>
          <div className="flex items-center gap-1">
            <FaGasPump />
            <span>0.15 ~ 1.15</span>
            <MdKeyboardArrowDown />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Staking;
