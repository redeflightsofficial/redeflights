"use client";

import { useReducer, useState } from "react";
import { SwapRoutesIcon } from "@/components/icons";

const fieldLabelClass = "text-[11px] font-extrabold uppercase tracking-wide text-[#0b2f57]";
const fieldInputClass =
  "mt-0.5 w-full min-w-0 border-0 bg-transparent p-0 text-sm font-semibold text-[#0b2f57] outline-none placeholder:font-medium placeholder:text-slate-500 sm:mt-1 sm:text-[15px]";

type RouteState = { from: string; to: string };

type RouteAction =
  | { type: "setFrom"; value: string }
  | { type: "setTo"; value: string }
  | { type: "swap" };

function routeReducer(state: RouteState, action: RouteAction): RouteState {
  switch (action.type) {
    case "setFrom":
      return { ...state, from: action.value };
    case "setTo":
      return { ...state, to: action.value };
    case "swap":
      return { from: state.to, to: state.from };
    default:
      return state;
  }
}

export function HeroRouteSwap() {
  const [route, dispatch] = useReducer(routeReducer, { from: "", to: "" });
  const [swapRotation, setSwapRotation] = useState(0);

  const swapRoute = () => {
    dispatch({ type: "swap" });
    setSwapRotation((prev) => prev + 180);
  };

  return (
    <div className="flex min-h-[56px] min-w-0 flex-row items-stretch gap-1 border-b border-slate-200 bg-white sm:min-h-[82px] sm:col-span-2 sm:gap-0 sm:border-r sm:border-b-0 lg:col-span-1">
      <label className="flex min-w-0 flex-1 flex-col justify-center px-2.5 py-2.5 sm:px-4 sm:py-4">
        <span className={fieldLabelClass}>From</span>
        <input
          type="text"
          name="from"
          autoComplete="off"
          value={route.from}
          onChange={(e) => dispatch({ type: "setFrom", value: e.target.value })}
          placeholder="City"
          className={fieldInputClass}
        />
      </label>

      <div className="flex w-10 shrink-0 items-center justify-center sm:w-16">
        <button
          type="button"
          aria-label="Swap departure and destination"
          title="Swap From and To"
          className="hero-route-swap flex h-9 w-9 min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded-full border-2 border-[#0b2f57] bg-white text-[#0b2f57] shadow-sm hover:border-[#e30613] hover:text-[#e30613] sm:h-11 sm:w-11 sm:min-h-[44px] sm:min-w-[44px]"
          style={{ transform: `rotate(${swapRotation}deg)` }}
          onClick={swapRoute}
        >
          <SwapRoutesIcon className="pointer-events-none h-4 w-4" />
        </button>
      </div>

      <label className="flex min-w-0 flex-1 flex-col justify-center border-l border-slate-100 px-2.5 py-2.5 sm:border-l-0 sm:px-4 sm:py-4">
        <span className={fieldLabelClass}>To</span>
        <input
          type="text"
          name="to"
          autoComplete="off"
          value={route.to}
          onChange={(e) => dispatch({ type: "setTo", value: e.target.value })}
          placeholder="City"
          className={fieldInputClass}
        />
      </label>
    </div>
  );
}
