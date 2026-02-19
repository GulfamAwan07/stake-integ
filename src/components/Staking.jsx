import React, { useState, useEffect } from "react";
import { FaGasPump } from "react-icons/fa";
import {
  MdKeyboardArrowDown,
  MdOutlineAccountBalanceWallet,
} from "react-icons/md";
import { useTonConnectUI, TonConnectButton } from "@tonconnect/ui-react";
import { TonClient, JettonMaster, Address, toNano } from "@ton/ton";
import { getTunaJettonWalletAddress } from "../utils/tonClient";

import {
  getTonBalance,
  getJettonWallet,
  getStakedBalance,
  buildStakePayload,
  buildUnstakePayload,
  STAKING_CONTRACT,
} from "../utils/tonClient";

const fmt = (n) =>
  Number(n).toLocaleString("en-US", { maximumFractionDigits: 4 });
const short = (addr) => (addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "");

export default function Staking() {
  const [mode, setMode] = useState("stake");
  const [amount, setAmount] = useState("");
  const [tonBalance, setTonBalance] = useState(null);
  const [stakedBalance, setStaked] = useState(null);
  const [loading, setLoading] = useState(false);
  const [balLoading, setBalLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const [tonConnectUI] = useTonConnectUI();
  const wallet = tonConnectUI.wallet;
  const userAddress = wallet?.account?.address;

  const loadBalances = async () => {
    if (!userAddress) return;
    setBalLoading(true);
    try {
      const tonBal = await getTonBalance(userAddress);
      setTonBalance(tonBal);
      const jettonWallet = await getJettonWallet(userAddress);
      const staked = await getStakedBalance(jettonWallet);
      setStaked(staked);
    } catch (e) {
      console.error("Balance load error:", e);
      setStaked(0);
    } finally {
      setBalLoading(false);
    }
  };

  useEffect(() => {
    loadBalances();
  }, [userAddress]);

  const handleStake = async () => {
    const parsedAmount = parseFloat(amount);
    console.log("Parsed amount:", parsedAmount);
    if (!parsedAmount || parsedAmount <= 0 || !wallet) return;

    setLoading(true);
    setStatus(null);
    try {
      const payload = buildStakePayload();
      const totalAmount = parsedAmount.toFixed(9);
      console.log("Total sending:", totalAmount);

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [
          {
            address: STAKING_CONTRACT,
            amount: toNano("1.05").toString(),
            payload: payload.toBoc().toString("base64"),
          },
        ],
      });

      setAmount("");
      setStatus({
        type: "success",
        msg: `Successfully staked ${parsedAmount} TON`,
      });
      setTimeout(loadBalances, 10000);
    } catch (err) {
      if (err?.message?.includes("Transaction was not sent")) return;
      setStatus({ type: "error", msg: err?.message || "Transaction failed" });
    } finally {
      setLoading(false);
    }
  };

  // handleUnstake

  const handleUnstake = async () => {
    if (!amount || !tonConnectUI.wallet) return;

    setLoading(true);
    setStatus(null);

    try {
      const jettonWalletAddress = await getTunaJettonWalletAddress(userAddress);

      if (!jettonWalletAddress) {
        setStatus({
          type: "error",
          msg: "Could not find your TUNA jetton wallet.",
        });
        return;
      }

      const payload = buildUnstakePayload(amount);

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [
          {
            address: jettonWalletAddress, // ✅ now a proper address string
            amount: toNano("1.05").toString(),
            payload: payload.toBoc().toString("base64"),
          },
        ],
      });

      setAmount("");
      setStatus({
        type: "success",
        msg: `Successfully requested unstake for ${amount} TUNA`,
      });
      setTimeout(loadBalances, 10000);
    } catch (err) {
      console.error("Unstake Error:", err);
      setStatus({
        type: "error",
        msg: err?.message || "Transaction rejected or failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const isStake = mode === "stake";
  const activeBal = isStake ? tonBalance : stakedBalance;
  const activeTicker = isStake ? "TON" : "TUNA";
  const receiveTicker = isStake ? "TUNA" : "TON";
  const isDisabled = loading || !wallet || !amount || Number(amount) <= 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: 40,
        paddingBottom: 80,
        paddingLeft: 16,
        paddingRight: 16,
        background:
          "linear-gradient(135deg,#0d0d14 0%,#111122 60%,#0a0a18 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          height: 700,
          borderRadius: "50%",
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse,rgba(99,60,255,0.07) 0%,transparent 70%)",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: 440,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Space Mono',monospace",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.5px",
              margin: 0,
              background: "linear-gradient(90deg,#e0d7ff,#a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            TON Stake
          </h1>
          <p
            style={{
              color: "#4b5563",
              fontSize: 11,
              marginTop: 3,
              fontFamily: "monospace",
              letterSpacing: 0.5,
            }}
          >
            TESTNET · {short(STAKING_CONTRACT)}
          </p>
        </div>

        {!wallet ? (
          <TonConnectButton />
        ) : (
          <button
            onClick={() => tonConnectUI.disconnect()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "rgba(167,139,250,0.08)",
              border: "1px solid rgba(167,139,250,0.2)",
              borderRadius: 12,
              padding: "7px 13px",
              cursor: "pointer",
            }}
          >
            <MdOutlineAccountBalanceWallet size={15} color="#a78bfa" />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                color: "#c4b5fd",
              }}
            >
              {short(userAddress)}
            </span>
            <span style={{ fontSize: 10, color: "#6b7280" }}>✕</span>
          </button>
        )}
      </div>

      {wallet && (
        <div
          style={{
            width: "100%",
            maxWidth: 440,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {[
            {
              label: "TON Balance",
              value: tonBalance,
              ticker: "TON",
              color: "#60a5fa",
            },
            {
              label: "Staked Balance",
              value: stakedBalance,
              ticker: "TUNA",
              color: "#a78bfa",
            },
          ].map(({ label, value, ticker, color }) => (
            <div
              key={label}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16,
                padding: "14px 16px",
              }}
            >
              <p
                style={{
                  color: "#6b7280",
                  fontSize: 11,
                  fontFamily: "monospace",
                  margin: "0 0 8px",
                }}
              >
                {label}
              </p>
              {balLoading ? (
                <div
                  style={{
                    height: 22,
                    width: 90,
                    borderRadius: 6,
                    background:
                      "linear-gradient(90deg,#1f1f2e,#2a2a3e,#1f1f2e)",
                    backgroundSize: "200%",
                    animation: "shimmer 1.4s infinite",
                  }}
                />
              ) : (
                <p
                  style={{
                    margin: 0,
                    color,
                    fontSize: 20,
                    fontWeight: 700,
                    fontFamily: "monospace",
                  }}
                >
                  {value !== null ? fmt(value) : "—"}
                  <span
                    style={{ fontSize: 11, color: "#6b7280", marginLeft: 5 }}
                  >
                    {ticker}
                  </span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            background: "rgba(0,0,0,0.35)",
            padding: 5,
            gap: 4,
          }}
        >
          {["stake", "unstake"].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setAmount("");
                setStatus(null);
              }}
              style={{
                padding: "11px 0",
                borderRadius: 14,
                border: "none",
                cursor: "pointer",
                fontFamily: "monospace",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                transition: "all 0.2s",
                background:
                  mode === m
                    ? m === "stake"
                      ? "linear-gradient(135deg,#4f46e5,#7c3aed)"
                      : "linear-gradient(135deg,#7c3aed,#a21caf)"
                    : "transparent",
                color: mode === m ? "#fff" : "#4b5563",
                boxShadow:
                  mode === m ? "0 4px 20px rgba(124,58,237,0.3)" : "none",
              }}
            >
              {m === "stake" ? "↓  Stake" : "↑  Unstake"}
            </button>
          ))}
        </div>

        <div style={{ padding: "22px 20px" }}>
          <div
            style={{
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16,
              padding: "16px 18px",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  color: "#6b7280",
                  fontSize: 11,
                  fontFamily: "monospace",
                }}
              >
                {isStake ? "You stake" : "You unstake"}
              </span>
              {wallet && (
                <span
                  style={{
                    color: "#6b7280",
                    fontSize: 11,
                    fontFamily: "monospace",
                  }}
                >
                  Bal:{" "}
                  <span style={{ color: "#9ca3af" }}>
                    {activeBal !== null ? fmt(activeBal) : "—"} {activeTicker}
                  </span>
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                type="number"
                min="0"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 36,
                  fontWeight: 700,
                  color: "#f9fafb",
                  fontFamily: "'Space Mono',monospace",
                }}
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    background: "rgba(167,139,250,0.12)",
                    border: "1px solid rgba(167,139,250,0.25)",
                    borderRadius: 10,
                    padding: "5px 11px",
                    fontFamily: "monospace",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#c4b5fd",
                  }}
                >
                  {activeTicker}
                </div>
                <button
                  onClick={() => setAmount(activeBal?.toString() ?? "")}
                  style={{
                    background: "rgba(167,139,250,0.12)",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: 6,
                    padding: "2px 8px",
                    fontSize: 10,
                    fontFamily: "monospace",
                    color: "#a78bfa",
                    fontWeight: 700,
                  }}
                >
                  MAX
                </button>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              margin: "6px 0",
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6b7280",
                fontSize: 14,
                userSelect: "none",
              }}
            >
              {isStake ? "↓" : "↑"}
            </div>
          </div>

          {/* you receive */}
          <div
            style={{
              background: "rgba(0,0,0,0.2)",
              border: "1px solid rgba(255,255,255,0.04)",
              borderRadius: 16,
              padding: "14px 18px",
              marginBottom: 18,
            }}
          >
            <p
              style={{
                color: "#6b7280",
                fontSize: 11,
                fontFamily: "monospace",
                margin: "0 0 8px",
              }}
            >
              You receive
            </p>
            <p
              style={{
                margin: 0,
                fontFamily: "monospace",
                fontSize: 30,
                fontWeight: 700,
                color: "#d1fae5",
              }}
            >
              {amount && Number(amount) > 0
                ? fmt(Number(amount) * 0.999)
                : "0.00"}
              <span style={{ fontSize: 13, color: "#6b7280", marginLeft: 7 }}>
                {receiveTicker}
              </span>
            </p>
          </div>

          {/* action button */}
          {!wallet ? (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <TonConnectButton />
            </div>
          ) : (
            <button
              onClick={isStake ? handleStake : handleUnstake}
              disabled={isDisabled}
              style={{
                width: "100%",
                padding: "15px 0",
                border: "none",
                borderRadius: 16,
                fontFamily: "monospace",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                cursor: isDisabled ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                opacity: isDisabled ? 0.45 : 1,
                background: isDisabled
                  ? "rgba(255,255,255,0.05)"
                  : isStake
                    ? "linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)"
                    : "linear-gradient(135deg,#7c3aed 0%,#a21caf 100%)",
                color: isDisabled ? "#4b5563" : "#fff",
                boxShadow: isDisabled
                  ? "none"
                  : "0 8px 32px rgba(124,58,237,0.35)",
              }}
            >
              {loading ? (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 13,
                      height: 13,
                      border: "2px solid rgba(255,255,255,0.25)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                      display: "inline-block",
                    }}
                  />
                  Processing…
                </span>
              ) : (
                `${isStake ? "Stake" : "Unstake"} ${amount ? amount + " " : ""}${activeTicker}`
              )}
            </button>
          )}

          {/* status */}
          {status && (
            <div
              style={{
                marginTop: 14,
                padding: "11px 14px",
                borderRadius: 12,
                background:
                  status.type === "success"
                    ? "rgba(16,185,129,0.08)"
                    : "rgba(239,68,68,0.08)",
                border: `1px solid ${
                  status.type === "success"
                    ? "rgba(16,185,129,0.25)"
                    : "rgba(239,68,68,0.25)"
                }`,
                fontFamily: "monospace",
                fontSize: 12,
                color: status.type === "success" ? "#6ee7b7" : "#fca5a5",
              }}
            >
              {status.type === "success" ? "✓  " : "✕  "}
              {status.msg}
            </div>
          )}

          {/* gas row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 16,
              paddingTop: 14,
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <span
              style={{
                color: "#374151",
                fontSize: 11,
                fontFamily: "monospace",
              }}
            >
              1 TON ≈ 0.999 TUNA
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: "#374151",
                fontSize: 11,
              }}
            >
              <FaGasPump size={10} />
              <span style={{ fontFamily: "monospace" }}>0.15 ~ 1.15 TON</span>
              <MdKeyboardArrowDown size={13} />
            </div>
          </div>
        </div>
      </div>

      {/* ── contract badge ── */}
      <div
        style={{
          marginTop: 20,
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: "#374151",
          fontSize: 11,
          fontFamily: "monospace",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#10b981",
            flexShrink: 0,
          }}
        />
        Contract: {short(STAKING_CONTRACT)}
        <a
          href={`https://testnet.tonscan.org/address/${STAKING_CONTRACT}`}
          target="_blank"
          rel="noreferrer"
          style={{ color: "#6d28d9", textDecoration: "none" }}
        >
          ↗
        </a>
      </div>

      {/* keyframes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
}
