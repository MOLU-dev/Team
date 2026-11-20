'use client';

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AssetEntry } from "./types";

interface FanStackProps {
  assets: AssetEntry[];
}

const PER_CARD     = 28;
const STEP_MS      = 58;
const PEEK_COUNT   = 4;
const PEEK_STEP    = 11;
const CARD_H       = 140;
const LIST_H       = 76;
const COMMIT_RATIO = 0.28;
const UP_THRESHOLD = 10;

function AssetInner({ asset }: { asset: AssetEntry }) {
  const isPositive = asset.priceChange24h >= 0;
  return (
    <>
      {/* Icon */}
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.06] border border-white/[0.05] flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
        {asset.icon}
      </div>

      {/* Name / badge */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="text-sm font-semibold text-text-primary truncate">{asset.name}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px] text-text-secondary uppercase tracking-wide">{asset.symbol}</span>
          {asset.chainBadge && asset.chainBadge !== 'ERC20' && asset.chainBadge !== 'BEP20' && (
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
              asset.isFiat
                ? 'bg-electric-blue/10 text-electric-blue'
                : 'bg-white/[0.06] text-text-secondary/80'
            }`}>
              {asset.chainBadge}
            </span>
          )}
        </div>
      </div>

      {/* Balance / change */}
      <div className="text-right flex-shrink-0 flex flex-col justify-center">
        <div className="text-sm font-semibold text-text-primary tabular-nums">{asset.amount}</div>
        <div className="flex items-center justify-end gap-1.5 mt-0.5">
          {!asset.isFiat && (
            <span className={`text-[10px] font-semibold ${isPositive ? 'text-success' : 'text-danger'}`}>
              {isPositive ? '+' : ''}{asset.priceChange24h.toFixed(2)}%
            </span>
          )}
          <span className="text-[11px] text-text-secondary">{asset.value}</span>
        </div>
      </div>

      {/* Chevron */}
      <div className="hidden sm:flex w-6 h-6 items-center justify-center rounded-lg text-text-secondary/40 group-hover:text-cyan transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </>
  );
}

export default function FanStack({ assets }: FanStackProps) {
  const TOTAL = assets.length;
  
  const [phase,     setPhaseRaw] = useState<"stacked"|"peeling"|"completing"|"list"|"restack-scrub"|"restacking"|"reverting">("stacked");
  const [fullCount, setFullRaw]  = useState(0);
  const [peelProg,  setPeel]     = useState(0);

  const phaseRef = useRef<"stacked"|"peeling"|"completing"|"list"|"restack-scrub"|"restacking"|"reverting">("stacked");
  const fullRef  = useRef(0);
  const setPhase = (p: typeof phaseRef.current) => { phaseRef.current = p; setPhaseRaw(p); };
  const setFull  = (fn: number | ((v: number) => number)) => {
    const next = typeof fn === "function" ? fn(fullRef.current) : fn;
    fullRef.current = Math.max(0, Math.min(TOTAL, next));
    setFullRaw(fullRef.current);
  };

  const peelStart  = useRef<number | null>(null);
  const peelLive   = useRef(0);

  const listRef         = useRef<HTMLDivElement | null>(null);

  const anims = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    return () => anims.current.forEach(clearTimeout);
  }, []);
  
  const clearAnims = () => { anims.current.forEach(clearTimeout); anims.current = []; };
  const after = (fn: () => void, ms: number) => { const t = setTimeout(fn, ms); anims.current.push(t); };
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  // ── Animation helpers ────────────────────────────────────────────

  const finishPeel = (from: number) => {
    clearAnims(); setPhase("completing"); setPeel(0);
    const rem = TOTAL - from;
    for (let i = 0; i < rem; i++) after(() => setFull(v => v + 1), i * STEP_MS);
    after(() => setPhase("list"), rem * STEP_MS + 80);
  };

  const cancelPeel = (from: number) => {
    if (from === 0) { setPhase("stacked"); setPeel(0); return; }
    clearAnims(); setPhase("reverting"); setPeel(0);
    for (let i = 0; i < from; i++) after(() => setFull(v => v - 1), i * STEP_MS);
    after(() => { setPhase("stacked"); setFull(0); }, from * STEP_MS + 80);
  };

  const finishRestack = (from: number) => {
    clearAnims(); setPhase("restacking"); setPeel(0);
    for (let i = 0; i < from; i++) after(() => setFull(v => v - 1), i * STEP_MS);
    after(() => { setPhase("stacked"); setFull(0); }, from * STEP_MS + 80);
  };

  const cancelRestack = (from: number) => {
    clearAnims(); setPhase("completing"); setPeel(0);
    const needed = TOTAL - from;
    for (let i = 0; i < needed; i++) after(() => setFull(v => v + 1), i * STEP_MS);
    after(() => setPhase("list"), needed * STEP_MS + 80);
  };

  // ── Peel gesture ─────────────────────────────────────────────────

  const onPeelDown = (e: React.PointerEvent) => {
    if (phaseRef.current !== "stacked") return;
    peelStart.current = e.clientY;
    peelLive.current  = 0;
    setPhase("peeling");
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPeelMove = (e: React.PointerEvent) => {
    if (phaseRef.current !== "peeling" || peelStart.current === null) return;
    const dy = clamp(e.clientY - peelStart.current, 0, TOTAL * PER_CARD);
    peelLive.current = dy;
    const showing = dy / PER_CARD;
    const fully   = Math.min(Math.floor(showing), TOTAL);
    setFull(fully);
    setPeel(fully < TOTAL ? showing % 1 : 0);
  };

  const onPeelUp = () => {
    if (phaseRef.current !== "peeling") return;
    peelStart.current = null;
    const from = fullRef.current;
    (peelLive.current >= TOTAL * PER_CARD * COMMIT_RATIO || from >= Math.ceil(TOTAL * 0.35))
      ? finishPeel(from) : cancelPeel(from);
  };

  const onPeelCancel = () => {
    if (phaseRef.current !== "peeling") return;
    peelStart.current = null;
    cancelPeel(fullRef.current);
  };

  // ── Native scroll (Restack via button) ───────────────────────────

  // ── Derived ──────────────────────────────────────────────────────

  const isPeeling      = phase === "peeling";
  const isRestackScrub = phase === "restack-scrub";
  const isFullList     = phase === "list";
  const isAnyScrub     = isPeeling || isRestackScrub;
  const showStack      = phase !== "list";
  const showList       = phase !== "stacked";

  const stackOpacity =
    phase === "stacked" ? 1 :
    isFullList          ? 0 :
    clamp(1 - ((fullCount + peelProg) / TOTAL) * 0.96, 0.04, 1);

  const stackShift = isPeeling ? Math.min(peelLive.current * 0.08, 10) : 0;
  const topAsset   = assets[0];

  if (!TOTAL || !topAsset) return null;

  return (
    <div className="w-full flex flex-col items-center select-none relative" style={{ touchAction: "none" }}>
      {/* Header Info */}
      <div className="text-center mb-6 z-10 relative flex justify-center items-center h-8">
        {isFullList ? (
          <button
            onClick={() => finishRestack(TOTAL)}
            className="px-6 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[10px] text-text-primary tracking-[0.2em] uppercase transition-colors cursor-pointer"
          >
            Restack Assets
          </button>
        ) : (
          <div className="text-[10px] tracking-widest text-text-secondary uppercase transition-opacity duration-300 pointer-events-none" style={{ opacity: isRestackScrub ? 0.6 : 1 }}>
            {isRestackScrub
              ? "scroll to view assets"
              : "hold & drag ↓ to peel"}
          </div>
        )}
      </div>

      {/* Stack */}
      {showStack && (
        <div
          onPointerDown={onPeelDown}
          onPointerMove={onPeelMove}
          onPointerUp={onPeelUp}
          onPointerCancel={onPeelCancel}
          style={{
            position: "relative",
            width: "100%",
            height: CARD_H + PEEK_COUNT * PEEK_STEP,
            cursor: phase === "stacked" || isPeeling ? "grab" : "default",
            touchAction: "none",
            opacity: stackOpacity,
            transform: `translateY(${stackShift}px)`,
            transition: phase === "stacked"
              ? "opacity 0.4s ease, transform 0.3s ease"
              : "opacity 0.08s linear",
            flexShrink: 0,
          }}
        >
          {Array.from({ length: Math.min(PEEK_COUNT, TOTAL - 1) }).map((_, i) => {
            const depth = PEEK_COUNT - i;
            const op    = Math.max(0.1, 1 - depth * 0.18);
            return (
              <div key={i} className="absolute left-0 right-0 rounded-2xl bg-[#0f1117] border border-white/[0.07] shadow-xl pointer-events-none" style={{
                bottom: depth * PEEK_STEP,
                height: CARD_H,
                transform: `scale(${1 - depth * 0.018})`,
                transformOrigin: "bottom center",
                opacity: op, 
                zIndex: i + 1,
              }}>
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/[0.08]" />
              </div>
            );
          })}

          <div className="absolute bottom-0 left-0 right-0 rounded-2xl bg-gradient-to-b from-[#0f1117] to-[#0f1117]/80 border border-white/[0.07] border-b-black/50 shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-[10] overflow-hidden flex flex-col justify-between" style={{
            height: CARD_H,
          }}>
            <div className="flex-1 flex items-center gap-3 sm:gap-4 px-4 py-3 sm:px-5">
              <AssetInner asset={topAsset} />
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {showList && (
        <div
          ref={listRef}
          style={{
            width: "100%",
            maxHeight: isFullList ? "62vh" : "none",
            overflowY: isFullList ? "auto" : "hidden",
            display: "flex", flexDirection: "column",
            scrollbarWidth: "none",
          }}
        >
          {assets.map((asset, idx) => {
            const fullyVis  = idx < fullCount;
            const isPartial = idx === fullCount && isAnyScrub;

            const cardH  = fullyVis ? LIST_H : isPartial ? Math.round(peelProg * LIST_H) : 0;
            const cardOp = fullyVis ? 1       : isPartial ? peelProg                      : 0;
            const mb     = cardH > 0 ? 8 : 0;

            const href = asset.isFiat
              ? '/fiat'
              : `/asset/${asset.symbol}${asset.chainId ? `?chain=${asset.chainId}` : ''}`;

            return (
              <div key={`${asset.symbol}-${asset.chainId}-${idx}`} style={{
                height: `${cardH}px`,
                minHeight: 0,
                marginBottom: `${mb}px`,
                overflow: "hidden",
                opacity: cardOp,
                transition: isAnyScrub
                  ? "none"
                  : "height 0.2s cubic-bezier(0.34,1.1,0.64,1), opacity 0.15s ease, margin-bottom 0.2s ease",
              }} className="flex-shrink-0 relative rounded-2xl">
                <Link
                  href={href}
                  className="absolute left-0 top-0 right-0 h-[76px] flex items-center gap-3 sm:gap-4 px-4 sm:px-5 bg-gradient-to-b from-[#0f1117] to-[#0f1117]/80 border border-white/[0.07] border-b-black/50 hover:bg-white/[0.04] hover:border-cyan/20 transition-colors group"
                  draggable={false}
                  onClick={(e) => {
                    if (isAnyScrub) e.preventDefault();
                  }}
                  style={{ borderRadius: '16px' }}
                >
                  <AssetInner asset={asset} />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 px-4 py-1.5 rounded-full bg-white/[0.025] border border-white/5 text-[9px] text-text-secondary/60 tracking-[0.3em] uppercase pointer-events-none">
        {phase === "stacked"
          ? `${TOTAL} assets · drag ↓ to peel`
          : isFullList
          ? `${TOTAL} assets`
          : `${fullCount} / ${TOTAL} peeled`}
      </div>
    </div>
  );
}
