import { supabase } from "./auth-client.js";

(() => {
  "use strict";

  const form = document.getElementById("flightSearchForm");
  const results = document.getElementById("flightResults");

  if (!form || !results) return;

  // =========================================================
  // 01. DESIGN SYSTEM — TRAVEL QILA / FLIGHT COMMAND
  // =========================================================

  function injectFlightStyles() {
    if (document.getElementById("tq-flight-command-styles")) return;

    const style = document.createElement("style");
    style.id = "tq-flight-command-styles";

    style.textContent = `
      #flightResults {
        --tq-bg: #080b12;
        --tq-panel: #101722;
        --tq-panel-2: #151f2d;
        --tq-line: rgba(255,255,255,.12);
        --tq-muted: #8d9bad;
        --tq-white: #f5f7fa;
        --tq-cyan: #00e5ff;
        --tq-lime: #c7ff4a;
        --tq-red: #ff4668;
        --tq-purple: #9c7bff;
        color: var(--tq-white);
        font-family: inherit;
      }

      #flightResults .tq-results-hero {
        position: relative;
        overflow: hidden;
        isolation: isolate;
        padding: clamp(22px,4vw,42px);
        margin: 20px 0 24px;
        border: 1px solid rgba(0,229,255,.28);
        border-radius: 22px;
        background:
          radial-gradient(ellipse at 90% 0%,rgba(0,229,255,.18),transparent 38%),
          radial-gradient(ellipse at 0% 100%,rgba(156,123,255,.15),transparent 38%),
          linear-gradient(125deg,#080d16,#111b2a 58%,#101421);
        box-shadow: 0 22px 65px rgba(0,0,0,.32);
      }

      #flightResults .tq-results-hero:after {
        content:"";
        position:absolute;
        z-index:-1;
        width:300px;
        height:300px;
        right:-100px;
        top:-150px;
        border:1px solid rgba(0,229,255,.2);
        border-radius:50%;
        box-shadow:0 0 0 25px rgba(0,229,255,.025),
                   0 0 0 55px rgba(0,229,255,.02),
                   0 0 0 90px rgba(0,229,255,.015);
      }

      #flightResults .tq-hero-kicker {
        display:inline-flex;
        align-items:center;
        gap:9px;
        color:var(--tq-cyan);
        font-size:10px;
        font-weight:900;
        letter-spacing:3px;
        text-transform:uppercase;
      }

      #flightResults .tq-hero-kicker:before {
        content:"";
        width:8px;
        height:8px;
        border-radius:50%;
        background:var(--tq-lime);
        box-shadow:0 0 14px var(--tq-lime);
      }

      #flightResults .tq-hero-title {
        margin:13px 0 7px;
        color:#fff;
        font-size:clamp(25px,4vw,43px);
        line-height:1.05;
        font-weight:950;
        letter-spacing:-1.8px;
        text-transform:uppercase;
      }

      #flightResults .tq-hero-title span {
        color:var(--tq-cyan);
      }

      #flightResults .tq-hero-subtitle {
        margin:0;
        color:#aab7c8;
        font-size:13px;
      }

      #flightResults .tq-hero-stats {
        display:flex;
        flex-wrap:wrap;
        gap:10px;
        margin-top:23px;
      }

      #flightResults .tq-hero-stat {
        min-width:105px;
        padding:10px 14px;
        border:1px solid rgba(255,255,255,.12);
        border-radius:10px;
        background:rgba(255,255,255,.045);
      }

      #flightResults .tq-hero-stat strong {
        display:block;
        color:#fff;
        font-size:17px;
        font-weight:900;
      }

      #flightResults .tq-hero-stat small {
        color:#91a0b3;
        font-size:9px;
        font-weight:800;
        letter-spacing:1.4px;
        text-transform:uppercase;
      }

      #flightResults .tq-booking-steps {
        display:flex;
        flex-wrap:wrap;
        gap:8px;
        margin:18px 0;
      }

      #flightResults .tq-booking-steps span {
        padding:9px 13px;
        border:1px solid var(--tq-line);
        border-radius:8px;
        color:#8e9caf;
        background:#101722;
        font-size:11px;
        font-weight:800;
        letter-spacing:.5px;
      }

      #flightResults .tq-booking-steps span.is-active {
        color:#071017;
        border-color:var(--tq-cyan);
        background:var(--tq-cyan);
        box-shadow:0 0 22px rgba(0,229,255,.22);
      }

      #flightResults .tq-booking-steps span.is-done {
        color:var(--tq-lime);
        border-color:rgba(199,255,74,.4);
        background:rgba(199,255,74,.07);
      }

      #flightResults .flight-results-tools {
        display:flex;
        flex-wrap:wrap;
        align-items:center;
        gap:10px;
        padding:15px;
        margin:18px 0 22px;
        border:1px solid var(--tq-line);
        border-radius:13px;
        background:#101722;
      }

      #flightResults .flight-results-tools label {
        color:#aab8c9;
        font-size:10px;
        font-weight:900;
        letter-spacing:1px;
        text-transform:uppercase;
      }

      #flightResults .flight-results-tools select {
        min-width:125px;
        padding:9px 28px 9px 10px;
        color:#fff;
        border:1px solid rgba(255,255,255,.16);
        border-radius:8px;
        background:#192536;
        font-size:12px;
      }

      #flightResults .flight-results-tools select:focus {
        outline:2px solid var(--tq-cyan);
        outline-offset:2px;
      }

      #flightResults .flight-results-tools .small {
        margin-left:auto;
        color:#aab8c9 !important;
        font-size:11px;
      }

      #flightResults .tq-leg-card {
        position:relative;
        overflow:hidden;
        isolation:isolate;
        padding:0;
        margin:0 0 20px;
        border:1px solid rgba(255,255,255,.13);
        border-radius:17px;
        color:#f5f7fa;
        background:
          radial-gradient(ellipse at 100% 0%,rgba(0,229,255,.09),transparent 35%),
          linear-gradient(145deg,#111a27,#0b111b 72%);
        box-shadow:0 13px 35px rgba(0,0,0,.2);
        transition:transform .22s ease,border-color .22s ease,
                   box-shadow .22s ease;
      }

      #flightResults .tq-leg-card:hover {
        transform:translateY(-4px);
        border-color:rgba(0,229,255,.55);
        box-shadow:0 22px 50px rgba(0,0,0,.35),
                   0 0 25px rgba(0,229,255,.07);
      }

      #flightResults .tq-leg-card:before {
        content:"";
        position:absolute;
        z-index:-1;
        top:0;
        left:0;
        width:4px;
        height:100%;
        background:linear-gradient(var(--tq-cyan),var(--tq-purple),var(--tq-lime));
      }

      #flightResults .tq-card-top {
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:16px;
        padding:21px 23px 17px;
        border-bottom:1px solid var(--tq-line);
      }

      #flightResults .tq-airline-block {
        display:flex;
        align-items:center;
        gap:13px;
        min-width:0;
      }

      #flightResults .tq-airline-mark {
        display:grid;
        place-items:center;
        flex:0 0 45px;
        width:45px;
        height:45px;
        border:1px solid rgba(0,229,255,.38);
        border-radius:12px;
        color:var(--tq-cyan);
        background:rgba(0,229,255,.08);
        font-size:15px;
        font-weight:950;
        letter-spacing:-1px;
      }

      #flightResults .tq-airline-name {
        color:#fff;
        font-size:17px;
        font-weight:950;
        letter-spacing:-.3px;
      }

      #flightResults .tq-flight-code {
        margin-top:4px;
        color:#91a2b6;
        font-size:11px;
        font-weight:700;
        letter-spacing:1px;
      }

      #flightResults .tq-price-block {
        text-align:right;
        flex:0 0 auto;
      }

      #flightResults .tq-price-label {
        display:block;
        color:#8c9bae;
        font-size:9px;
        font-weight:900;
        letter-spacing:2px;
        text-transform:uppercase;
      }

      #flightResults .tq-price-value {
        display:block;
        margin-top:2px;
        color:var(--tq-lime);
        font-size:clamp(23px,3vw,32px);
        line-height:1;
        font-weight:950;
        letter-spacing:-1.2px;
        text-shadow:0 0 20px rgba(199,255,74,.14);
      }

      #flightResults .tq-price-note {
        display:block;
        margin-top:6px;
        color:#8c9bae;
        font-size:10px;
      }

      #flightResults .tq-route-panel {
        display:grid;
        grid-template-columns:minmax(0,1fr) minmax(100px,.75fr) minmax(0,1fr);
        align-items:center;
        gap:12px;
        padding:25px 23px 20px;
      }

      #flightResults .tq-route-end:last-child {
        text-align:right;
      }

      #flightResults .tq-route-time {
        color:#fff;
        font-size:clamp(25px,4vw,36px);
        line-height:1;
        font-weight:950;
        letter-spacing:-1.5px;
      }

      #flightResults .tq-route-code {
        margin-top:7px;
        color:var(--tq-cyan);
        font-size:12px;
        font-weight:950;
        letter-spacing:1px;
      }

      #flightResults .tq-route-city {
        margin-top:3px;
        color:#9baabd;
        font-size:11px;
      }

      #flightResults .tq-route-middle {
        text-align:center;
      }

      #flightResults .tq-route-duration {
        color:#fff;
        font-size:12px;
        font-weight:900;
      }

      #flightResults .tq-route-track {
        position:relative;
        height:2px;
        margin:13px 5px 11px;
        background:linear-gradient(90deg,var(--tq-cyan),var(--tq-purple),var(--tq-lime));
      }

      #flightResults .tq-route-track:before,
      #flightResults .tq-route-track:after {
        content:"";
        position:absolute;
        top:50%;
        width:7px;
        height:7px;
        border:2px solid var(--tq-cyan);
        border-radius:50%;
        background:#101722;
        transform:translateY(-50%);
      }

      #flightResults .tq-route-track:before { left:0; }
      #flightResults .tq-route-track:after {
        right:0;
        border-color:var(--tq-lime);
      }

      #flightResults .tq-route-plane {
        position:absolute;
        top:50%;
        left:50%;
        padding:0 7px;
        color:var(--tq-cyan);
        background:#101722;
        font-size:17px;
        transform:translate(-50%,-50%);
      }

      #flightResults .tq-stop-label {
        display:inline-block;
        color:var(--tq-lime);
        font-size:10px;
        font-weight:900;
        letter-spacing:1px;
        text-transform:uppercase;
      }

      #flightResults .tq-card-tags {
        display:flex;
        flex-wrap:wrap;
        gap:7px;
        padding:0 23px 18px;
      }

      #flightResults .tq-tag {
        display:inline-flex;
        align-items:center;
        gap:5px;
        padding:7px 10px;
        border:1px solid rgba(255,255,255,.11);
        border-radius:6px;
        color:#b9c6d5;
        background:rgba(255,255,255,.035);
        font-size:10px;
        font-weight:800;
      }

      #flightResults .tq-tag.highlight {
        color:var(--tq-cyan);
        border-color:rgba(0,229,255,.25);
        background:rgba(0,229,255,.06);
      }

      #flightResults .tq-tag.warning {
        color:#ffcb70;
        border-color:rgba(255,203,112,.25);
        background:rgba(255,203,112,.06);
      }

      #flightResults .tq-connection-details {
        margin:0 23px 18px;
        overflow:hidden;
        border:1px solid rgba(0,229,255,.22);
        border-radius:11px;
        background:rgba(0,229,255,.025);
      }

      #flightResults .tq-connection-details summary {
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:10px;
        padding:13px 15px;
        color:var(--tq-cyan);
        cursor:pointer;
        list-style:none;
        font-size:11px;
        font-weight:900;
        letter-spacing:.8px;
        text-transform:uppercase;
      }

      #flightResults .tq-connection-details summary::-webkit-details-marker {
        display:none;
      }

      #flightResults .tq-connection-details summary:after {
        content:"+";
        color:var(--tq-lime);
        font-size:21px;
        line-height:1;
      }

      #flightResults .tq-connection-details[open] summary:after {
        content:"−";
      }

      #flightResults .tq-connection-content {
        padding:5px 15px 16px;
        border-top:1px solid rgba(255,255,255,.08);
      }

      #flightResults .tq-journey-overview {
        display:flex;
        flex-wrap:wrap;
        gap:8px;
        margin:12px 0 17px;
      }

      #flightResults .tq-journey-overview span {
        padding:6px 9px;
        border-radius:5px;
        color:#c0ccda;
        background:rgba(255,255,255,.06);
        font-size:10px;
        font-weight:800;
      }

      #flightResults .tq-timeline {
        position:relative;
        padding-left:26px;
      }

      #flightResults .tq-timeline:before {
        content:"";
        position:absolute;
        top:10px;
        bottom:12px;
        left:7px;
        width:2px;
        background:linear-gradient(var(--tq-cyan),var(--tq-purple),var(--tq-lime));
        opacity:.7;
      }

      #flightResults .tq-timeline-leg {
        position:relative;
        padding:0 0 17px;
      }

      #flightResults .tq-timeline-leg:before {
        content:"";
        position:absolute;
        top:4px;
        left:-24px;
        width:10px;
        height:10px;
        border:2px solid var(--tq-cyan);
        border-radius:50%;
        background:#101722;
        box-shadow:0 0 12px rgba(0,229,255,.35);
      }

      #flightResults .tq-timeline-leg:last-child:before {
        border-color:var(--tq-lime);
      }

      #flightResults .tq-leg-label {
        color:var(--tq-cyan);
        font-size:9px;
        font-weight:950;
        letter-spacing:1.5px;
        text-transform:uppercase;
      }

      #flightResults .tq-leg-airports {
        margin-top:5px;
        color:#fff;
        font-size:13px;
        font-weight:900;
      }

      #flightResults .tq-leg-meta {
        margin-top:5px;
        color:#94a4b8;
        font-size:11px;
      }

      #flightResults .tq-layover {
        position:relative;
        padding:11px 13px;
        margin:0 0 17px;
        border:1px dashed rgba(255,203,112,.35);
        border-radius:8px;
        background:rgba(255,203,112,.045);
      }

      #flightResults .tq-layover-title {
        color:#ffcb70;
        font-size:10px;
        font-weight:950;
        letter-spacing:1px;
        text-transform:uppercase;
      }

      #flightResults .tq-layover-meta {
        margin-top:5px;
        color:#c4b49b;
        font-size:11px;
      }

      #flightResults .tq-card-footer {
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:14px;
        padding:15px 23px;
        border-top:1px solid var(--tq-line);
        background:rgba(0,0,0,.14);
      }

      #flightResults .tq-card-footer-info {
        display:flex;
        flex-wrap:wrap;
        gap:7px 13px;
        color:#9baabd;
        font-size:10px;
        font-weight:700;
      }

      #flightResults .flight-select-leg {
        padding:12px 18px;
        border:1px solid var(--tq-cyan);
        border-radius:8px;
        color:#061018;
        background:var(--tq-cyan);
        font-size:11px;
        font-weight:950;
        letter-spacing:.8px;
        text-transform:uppercase;
        cursor:pointer;
        transition:.2s ease;
      }

      #flightResults .flight-select-leg:hover {
        color:#061018;
        background:var(--tq-lime);
        border-color:var(--tq-lime);
        box-shadow:0 0 24px rgba(199,255,74,.2);
        transform:translateY(-2px);
      }

      #flightResults button:disabled {
        opacity:.55;
        cursor:not-allowed;
        transform:none;
      }

      #flightResults .tq-summary-card {
        overflow:hidden;
        border:1px solid rgba(0,229,255,.25);
        border-radius:17px;
        background:linear-gradient(145deg,#111a27,#090f18);
        box-shadow:0 20px 50px rgba(0,0,0,.25);
      }

      #flightResults .tq-summary-heading {
        display:flex;
        justify-content:space-between;
        gap:15px;
        align-items:center;
        padding:22px;
        background:radial-gradient(ellipse at 100% 0%,rgba(0,229,255,.12),transparent 55%);
        border-bottom:1px solid var(--tq-line);
      }

      #flightResults .tq-summary-heading h3 {
        margin:6px 0;
        color:#fff;
        font-size:clamp(20px,3vw,30px);
        font-weight:950;
      }

      #flightResults .tq-summary-heading p {
        margin:0;
        color:#9baabd;
        font-size:12px;
      }

      #flightResults .tq-summary-leg {
        padding:20px 22px;
        border-bottom:1px solid var(--tq-line);
      }

      #flightResults .tq-summary-leg-title {
        margin-bottom:9px;
        color:var(--tq-cyan);
        font-size:10px;
        font-weight:950;
        letter-spacing:1.5px;
        text-transform:uppercase;
      }

      #flightResults .tq-summary-leg > strong {
        color:#fff;
        font-size:16px;
      }

      #flightResults .tq-summary-route {
        margin-top:8px;
        color:#dce5ef;
        font-size:13px;
        font-weight:800;
      }

      #flightResults .tq-summary-times {
        margin-top:5px;
        color:#91a2b6;
        font-size:11px;
      }

      #flightResults .tq-summary-fare {
        margin-top:10px;
        color:var(--tq-lime);
        font-size:12px;
        font-weight:900;
      }

      #flightResults .tq-price-breakdown {
        padding:22px;
        color:#dce5ef;
      }

      #flightResults .tq-price-breakdown h5 {
        color:#fff;
        font-weight:950;
        letter-spacing:.3px;
      }

      #flightResults .tq-fare-category,
      #flightResults .tq-price-breakdown > div:not(.tq-grand-total) {
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:15px;
        padding:11px 0;
        border-bottom:1px solid rgba(255,255,255,.08);
        font-size:12px;
      }

      #flightResults .tq-fare-category strong,
      #flightResults .tq-price-breakdown strong {
        color:#fff;
      }

      #flightResults .tq-fare-category small {
        display:block;
        margin-top:4px;
        color:#91a2b6;
        font-size:10px;
      }

      #flightResults .tq-grand-total {
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:15px;
        padding:17px;
        margin-top:13px;
        border:1px solid rgba(199,255,74,.3);
        border-radius:10px;
        color:var(--tq-lime);
        background:rgba(199,255,74,.06);
        font-size:13px;
        font-weight:950;
      }

      #flightResults .tq-grand-total strong {
        color:var(--tq-lime);
        font-size:24px;
      }

      #flightResults .tq-summary-actions {
        display:flex;
        flex-wrap:wrap;
        gap:9px;
        padding:0 22px 20px;
      }

      #flightResults .tq-summary-actions button {
        border-radius:8px;
        font-size:11px;
        font-weight:900;
      }

      #flightResults .tq-empty-state {
        padding:40px 20px;
        border:1px dashed rgba(255,255,255,.2);
        border-radius:15px;
        color:#9baabd;
        background:#101722;
        text-align:center;
      }

      #flightResults .tq-empty-state strong {
        display:block;
        margin-bottom:7px;
        color:#fff;
        font-size:18px;
      }

      #flightResults .tq-demo-notice {
        padding:10px 13px;
        margin:12px 0 20px;
        border-left:3px solid #ffcb70;
        border-radius:4px;
        color:#c4b49b;
        background:rgba(255,203,112,.055);
        font-size:10px;
      }

      @media(max-width:650px) {
        #flightResults .tq-card-top {
          padding:16px;
        }

        #flightResults .tq-route-panel {
          grid-template-columns:minmax(0,1fr) minmax(70px,.65fr) minmax(0,1fr);
          gap:6px;
          padding:22px 15px 17px;
        }

        #flightResults .tq-route-time {
          font-size:25px;
        }

        #flightResults .tq-route-city {
          font-size:10px;
        }

        #flightResults .tq-card-tags {
          padding:0 15px 15px;
        }

        #flightResults .tq-connection-details {
          margin:0 15px 15px;
        }

        #flightResults .tq-card-footer {
          align-items:stretch;
          flex-direction:column;
          padding:14px 15px;
        }

        #flightResults .flight-select-leg {
          width:100%;
        }

        #flightResults .tq-price-value {
          font-size:23px;
        }

        #flightResults .tq-airline-name {
          font-size:14px;
        }

        #flightResults .tq-airline-mark {
          width:38px;
          height:38px;
          flex-basis:38px;
        }

        #flightResults .flight-results-tools .small {
          width:100%;
          margin-left:0;
        }

        #flightResults .tq-summary-heading {
          align-items:flex-start;
          flex-direction:column;
        }

        #flightResults .tq-summary-actions {
          padding:0 15px 17px;
        }

        #flightResults .tq-summary-actions button {
          flex:1 1 42%;
        }
      }

      @media(prefers-reduced-motion:reduce) {
        #flightResults *,
        #flightResults *:before,
        #flightResults *:after {
          scroll-behavior:auto !important;
          transition:none !important;
          animation:none !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  injectFlightStyles();

  // =========================================================
  // 02. CONFIGURATION
  // =========================================================

  const FARE_CONFIG = {
    adultMultiplier: 1,
    childMultiplier: 0.75,
    infantMultiplier: 0.25,
    taxRate: 0.05,
    currency: "INR"
  };

  const airportMap = {
    DEL: "New Delhi",
    BOM: "Mumbai",
    BLR: "Bengaluru",
    HYD: "Hyderabad",
    MAA: "Chennai",
    CCU: "Kolkata",
    GOI: "Goa",
    AMD: "Ahmedabad",
    PNQ: "Pune",
    COK: "Kochi",
    JAI: "Jaipur",
    DXB: "Dubai",
    SIN: "Singapore",
    BKK: "Bangkok",
    LHR: "London",
    DOH: "Doha",
    AUH: "Abu Dhabi",
    KUL: "Kuala Lumpur",
    HKT: "Phuket",
    JFK: "New York"
  };

  const sampleOffers = [
    { airline: "IndiGo", flight: "6E 2145", depart: "06:10", duration: 135, stops: 0, price: 6450, baggage: "15 kg check-in" },
    { airline: "Air India", flight: "AI 887", depart: "07:35", duration: 150, stops: 0, price: 7850, baggage: "15 kg check-in" },
    { airline: "Akasa Air", flight: "QP 1320", depart: "09:20", duration: 150, stops: 0, price: 6990, baggage: "15 kg check-in" },
    { airline: "Air India Express", flight: "IX 1042", depart: "11:45", duration: 205, stops: 1, price: 5980, baggage: "15 kg check-in" },
    { airline: "IndiGo", flight: "6E 6087", depart: "13:15", duration: 155, stops: 0, price: 7350, baggage: "15 kg check-in" },
    { airline: "Air India", flight: "AI 441", depart: "16:40", duration: 225, stops: 1, price: 8250, baggage: "25 kg check-in" },
    { airline: "Akasa Air", flight: "QP 1718", depart: "18:30", duration: 155, stops: 0, price: 7590, baggage: "15 kg check-in" },
    { airline: "IndiGo", flight: "6E 9912", depart: "21:15", duration: 215, stops: 1, price: 6250, baggage: "15 kg check-in" },
    { airline: "Air India", flight: "AI 6721", depart: "05:50", duration: 420, stops: 2, price: 9150, baggage: "25 kg check-in" },
    { airline: "IndiGo", flight: "6E 7724", depart: "14:05", duration: 390, stops: 2, price: 8750, baggage: "15 kg check-in" }
  ];

  const byId = id => document.getElementById(id);

  const safe = value =>
    String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));

  const money = value => {
    const amount = Number(value || 0);

    if (!Number.isFinite(amount)) return "₹0";

    const currencyAPI = window.TravelQilaCurrency;
    const selectedCurrency =
      currencyAPI?.getCurrency?.() || "INR";
    const rates = currencyAPI?.getRates?.();

    if (!currencyAPI || !rates) {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
      }).format(amount);
    }

    const converted = currencyAPI.convert(
      amount,
      "INR",
      selectedCurrency
    );

    if (!Number.isFinite(converted)) {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
      }).format(amount);
    }

    const locales = {
      INR: "en-IN",
      USD: "en-US",
      EUR: "de-DE",
      GBP: "en-GB"
    };

    try {
      return new Intl.NumberFormat(
        locales[selectedCurrency] || "en-IN",
        {
          style: "currency",
          currency: selectedCurrency,
          maximumFractionDigits: 2
        }
      ).format(converted);
    } catch {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
      }).format(amount);
    }
  };

  const durationText = minutes => {
    const value = Math.max(0, Math.floor(Number(minutes) || 0));
    const hours = Math.floor(value / 60);
    const mins = value % 60;

    return hours
      ? hours + "h " + (mins ? mins + "m" : "")
      : mins + "m";
  };

  const formatDate = value =>
    value
      ? new Date(value + "T12:00:00").toLocaleDateString(
          "en-IN",
          { day: "numeric", month: "short", year: "numeric" }
        )
      : "";

  const shiftDate = (value, days) => {
    const d = new Date(value + "T12:00:00");
    d.setDate(d.getDate() + days);

    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  };

  const addMinutes = (time, minutes) => {
    const p = time.split(":").map(Number);
    const n = (p[0] * 60 + p[1] + minutes) % 1440;

    return String(Math.floor(n / 60)).padStart(2, "0") +
      ":" + String(n % 60).padStart(2, "0");
  };

  function addDateTime(date, time, minutes) {
    const [year, month, day] = date.split("-").map(Number);
    const [hours, mins] = time.split(":").map(Number);
    const value = new Date(year, month - 1, day, hours, mins + minutes);

    return {
      date: value.getFullYear() + "-" +
        String(value.getMonth() + 1).padStart(2, "0") + "-" +
        String(value.getDate()).padStart(2, "0"),
      time: String(value.getHours()).padStart(2, "0") + ":" +
        String(value.getMinutes()).padStart(2, "0")
    };
  }

  // =========================================================
  // 03. CONNECTION ENGINE
  // =========================================================

  const CONNECTION_HUBS = [
    { code: "BOM", city: "Mumbai" },
    { code: "BLR", city: "Bengaluru" },
    { code: "HYD", city: "Hyderabad" },
    { code: "MAA", city: "Chennai" },
    { code: "CCU", city: "Kolkata" },
    { code: "DOH", city: "Doha" },
    { code: "DXB", city: "Dubai" },
    { code: "AUH", city: "Abu Dhabi" },
    { code: "SIN", city: "Singapore" },
    { code: "KUL", city: "Kuala Lumpur" }
  ];

  function buildConnectionDetails(
    origin,
    destination,
    date,
    depart,
    duration,
    stops,
    seed,
    index
  ) {
    if (!stops) {
      const arrival = addDateTime(date, depart, duration);

      return {
        segments: [{
          from: origin,
          to: destination,
          depart,
          arrive: arrival.time,
          departureDate: date,
          arrivalDate: arrival.date,
          duration,
          flight: null
        }],
        layovers: [],
        arrive: arrival.time,
        arrivalDate: arrival.date
      };
    }

    const candidates = CONNECTION_HUBS.filter(hub =>
      hub.code !== origin.code &&
      hub.code !== destination.code
    );

    const hubs = [];
    let cursor = (seed + index * 3) % candidates.length;

    while (hubs.length < stops && hubs.length < candidates.length) {
      const hub = candidates[cursor % candidates.length];

      if (!hubs.some(item => item.code === hub.code)) {
        hubs.push(hub);
      }

      cursor += 3;
    }

    for (const hub of candidates) {
      if (hubs.length >= stops) break;

      if (!hubs.some(item => item.code === hub.code)) {
        hubs.push(hub);
      }
    }

    const points = [
      origin,
      ...hubs.map(hub => ({
        code: hub.code,
        city: hub.city,
        label: hub.city
      })),
      destination
    ];

    const layoverDurations = Array.from(
      { length: stops },
      (_, i) => 85 + ((seed + index * 17 + i * 29) % 76)
    );

    const totalLayover = layoverDurations.reduce(
      (sum, value) => sum + value,
      0
    );

    const totalFlying = Math.max(
      stops + 1,
      duration - totalLayover
    );

    const baseFlight = Math.floor(
      totalFlying / (stops + 1)
    );

    let flyingRemainder =
      totalFlying - baseFlight * (stops + 1);

    let clockDate = date;
    let clockTime = depart;

    const segments = [];
    const layovers = [];

    for (let i = 0; i <= stops; i++) {
      const segmentDuration =
        baseFlight + (flyingRemainder-- > 0 ? 1 : 0);

      const arrival = addDateTime(
        clockDate,
        clockTime,
        segmentDuration
      );

      segments.push({
        from: points[i],
        to: points[i + 1],
        depart: clockTime,
        arrive: arrival.time,
        departureDate: clockDate,
        arrivalDate: arrival.date,
        duration: segmentDuration,
        flight: null
      });

      clockDate = arrival.date;
      clockTime = arrival.time;

      if (i < stops) {
        const nextDeparture = addDateTime(
          clockDate,
          clockTime,
          layoverDurations[i]
        );

        layovers.push({
          airport: points[i + 1],
          arrival: clockTime,
          departure: nextDeparture.time,
          arrivalDate: clockDate,
          departureDate: nextDeparture.date,
          duration: layoverDurations[i]
        });

        clockDate = nextDeparture.date;
        clockTime = nextDeparture.time;
      }
    }

    segments.forEach((segment, i) => {
      segment.flight = " " + String(i + 1);
    });

    return {
      segments,
      layovers,
      arrive: segments[segments.length - 1].arrive,
      arrivalDate: segments[segments.length - 1].arrivalDate
    };
  }

  function airportName(airport) {
    return airport?.label ||
      airport?.city ||
      airport?.code ||
      "Unknown airport";
  }

  function connectionMarkup(option) {
    if (
      !option?.stops ||
      !Array.isArray(option.layovers) ||
      !option.layovers.length
    ) {
      return "";
    }

    const segments = option.segments || [];

    const totalLayover = option.layovers.reduce(
      (sum, item) => sum + Number(item.duration || 0),
      0
    );

    const totalFlying = segments.reduce(
      (sum, item) => sum + Number(item.duration || 0),
      0
    );

    const overnight = option.layovers.some(
      item => item.arrivalDate !== item.departureDate
    );

    const segmentRows = segments.map((segment, index) => {
      const flightDate = formatDate(segment.departureDate);

      const segmentMarkup =
        '<div class="tq-timeline-leg">' +
          '<div class="tq-leg-label">FLIGHT LEG ' +
            String(index + 1).padStart(2, "0") +
          '</div>' +
          '<div class="tq-leg-airports">' +
            safe(airportName(segment.from)) +
            ' (' + safe(segment.from.code || "—") + ')' +
            ' → ' +
            safe(airportName(segment.to)) +
            ' (' + safe(segment.to.code || "—") + ')' +
          '</div>' +
          '<div class="tq-leg-meta">' +
            safe(segment.flight || option.flight) +
            ' &nbsp;·&nbsp; ' +
            safe(segment.depart) +
            ' – ' +
            safe(segment.arrive) +
            ' &nbsp;·&nbsp; ' +
            durationText(segment.duration) +
            ' &nbsp;·&nbsp; ' +
            safe(flightDate) +
          '</div>' +
        '</div>';

      const layover = option.layovers[index];

      const layoverMarkup = layover
        ? '<div class="tq-layover">' +
            '<div class="tq-layover-title">' +
              'CONNECTION / ' +
              safe(airportName(layover.airport)) +
              ' (' + safe(layover.airport.code || "—") + ')' +
            '</div>' +
            '<div class="tq-layover-meta">' +
              'Arrive ' + safe(layover.arrival) +
              ' · Depart ' + safe(layover.departure) +
              ' · ' + durationText(layover.duration) +
              (layover.arrivalDate !== layover.departureDate
                ? ' · Overnight connection'
                : '') +
            '</div>' +
          '</div>'
        : "";

      return segmentMarkup + layoverMarkup;
    }).join("");

    return '<details class="tq-connection-details">' +
      '<summary>' +
        '<span>EXPLORE FLIGHT CONNECTIONS</span>' +
        '<span>' +
          option.stops + ' STOP' +
          (option.stops > 1 ? "S" : "") +
          ' · ' + durationText(totalLayover) +
          ' TOTAL LAYOVER' +
        '</span>' +
      '</summary>' +
      '<div class="tq-connection-content">' +
        '<div class="tq-journey-overview">' +
          '<span>' + segments.length + ' flight legs</span>' +
          '<span>' + durationText(totalFlying) + ' in the air</span>' +
          '<span>' + durationText(totalLayover) + ' layover</span>' +
          (overnight ? '<span>Overnight connection</span>' : '') +
        '</div>' +
        '<div class="tq-timeline">' +
          segmentRows +
        '</div>' +
      '</div>' +
    '</details>';
  }

  // =========================================================
  // 04. AIRPORT AND SEARCH STATE
  // =========================================================

  function parseAirport(value) {
    const text = String(value).trim();
    const match = text.match(/\(([A-Za-z]{3})\)\s*$/);
    const code = match ? match[1].toUpperCase() : "";
    const city = text.replace(/\s*\([A-Za-z]{3}\)\s*$/, "");

    return {
      city: city || text,
      code,
      label: code ? (airportMap[code] || city) : city
    };
  }

  let search = null;
  let outboundOptions = [];
  let returnOptions = [];
  let selectedOutbound = null;
  let selectedReturn = null;
  let stage = "outbound";
  let wishlistId = null;

  let resultFilters = {
    stops: "any",
    airline: "all",
    sort: "price"
  };

  function passengers() {
    if (!search) return 0;

    return search.adults +
      search.children +
      search.infants;
  }

  // =========================================================
  // 05. PASSENGER VALIDATION
  // =========================================================

  function syncInfantLimit() {
    const infantsInput = byId("infants");

    if (!infantsInput) return;

    if (infantsInput.tagName === "SELECT") {
      Array.from(infantsInput.options).forEach(option => {
        option.disabled = false;
      });
    }

    infantsInput.setCustomValidity("");
  }

  function validatePassengerCounts() {
    const adultsInput = byId("adults");
    const childrenInput = byId("children");
    const infantsInput = byId("infants");

    if (!adultsInput || !childrenInput || !infantsInput) {
      return null;
    }

    const adults = Number(adultsInput.value);
    const children = Number(childrenInput.value);
    const infants = Number(infantsInput.value);

    [adultsInput, childrenInput, infantsInput].forEach(input => {
      input.setCustomValidity("");
    });

    if (
      !Number.isInteger(adults) ||
      !Number.isInteger(children) ||
      !Number.isInteger(infants) ||
      adults < 0 ||
      children < 0 ||
      infants < 0
    ) {
      adultsInput.setCustomValidity(
        "Please enter valid passenger counts."
      );

      adultsInput.reportValidity();
      adultsInput.focus();

      return null;
    }

    if (infants > 0 && adults === 0) {
      infantsInput.setCustomValidity(
        "At least one adult is required when travelling with an infant."
      );

      infantsInput.reportValidity();
      infantsInput.focus();

      return null;
    }

    return { adults, children, infants };
  }

  // =========================================================
  // 06. FLIGHT DATA GENERATOR
  // =========================================================

  function makeOptions(origin, destination, date, seedText) {
    const seed = seedText.split("").reduce(
      (n, c) => n + c.charCodeAt(0),
      0
    );

    return sampleOffers.map((offer, index) => {
      const shift = seed % 7;
      const depart = addMinutes(offer.depart, shift * 4);

      const duration =
        offer.duration +
        shift * 3 +
        (index % 2 ? 10 : 0);

      const flexibility = search?.dateFlexibility || "Exact dates";

      const offsets =
        flexibility === "1 day before or after"
          ? [0, -1, 1, 0, 0, 0, 0, 0]
          : flexibility === "3 days before or after" ||
            flexibility === "Flexible - lowest fare matters most"
            ? [0, -1, 1, -2, 2, -3, 3, 0]
            : [0, 0, 0, 0, 0, 0, 0, 0];

      const dateOffset = offsets[index] || 0;

      const price = Math.round((
        offer.price +
        (seed % 13) * 175 +
        (index % 3) * 260 +
        (dateOffset < 0
          ? Math.abs(dateOffset) * -80
          : dateOffset * 40)
      ) / 10) * 10;

      const departureDate = shiftDate(date, dateOffset);

      const connections = buildConnectionDetails(
        origin,
        destination,
        departureDate,
        depart,
        duration,
        offer.stops,
        seed,
        index
      );

      const segments = connections.segments.map(
        (segment, segmentIndex) => ({
          ...segment,
          flight: offer.flight +
            (segmentIndex ? "-" + (segmentIndex + 1) : "")
        })
      );

      return {
        id: "leg-" + seed + "-" + index,
        airline: offer.airline,
        flight: offer.flight,
        depart,
        arrive: connections.arrive,
        arrivalDate: connections.arrivalDate,
        duration,
        stops: offer.stops,
        segments,
        layovers: connections.layovers,
        price,
        baggage: offer.baggage,
        origin,
        destination,
        departureDate
      };
    });
  }

  // =========================================================
  // 07. PASSENGER FARE ENGINE
  // =========================================================

  function pricing(
    outbound = selectedOutbound,
    returning = selectedReturn
  ) {
    const outboundFare = outbound?.price || 0;
    const returnFare = returning?.price || 0;

    const categories = [
      {
        key: "adults",
        label: "Adults",
        count: search.adults,
        multiplier: FARE_CONFIG.adultMultiplier
      },
      {
        key: "children",
        label: "Children",
        count: search.children,
        multiplier: FARE_CONFIG.childMultiplier
      },
      {
        key: "infants",
        label: "Infants",
        count: search.infants,
        multiplier: FARE_CONFIG.infantMultiplier
      }
    ];

    const breakdown = categories.map(category => {
      const outboundPerPerson = Math.round(
        outboundFare * category.multiplier
      );

      const returnPerPerson = Math.round(
        returnFare * category.multiplier
      );

      const outboundTotal =
        outboundPerPerson * category.count;

      const returnTotal =
        returnPerPerson * category.count;

      return {
        key: category.key,
        label: category.label,
        count: category.count,
        multiplier: category.multiplier,
        outboundPerPerson,
        returnPerPerson,
        outboundTotal,
        returnTotal,
        subtotal: outboundTotal + returnTotal
      };
    });

    const baseFare = breakdown.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    const taxAmount = Math.round(
      baseFare * FARE_CONFIG.taxRate
    );

    const totalFare = baseFare + taxAmount;
    const passengerCount = passengers();

    return {
      baseFare,
      taxAmount,
      totalFare,
      taxRate: FARE_CONFIG.taxRate,
      currency: FARE_CONFIG.currency,
      categories: breakdown,
      outboundAdultFare: outboundFare,
      returnAdultFare: returnFare,
      averageFarePerPassenger: passengerCount
        ? totalFare / passengerCount
        : 0,
      pricingModel: "illustrative_category_based"
    };
  }

  // =========================================================
  // 08. ITINERARY OBJECT
  // =========================================================

  function itinerary() {
    const p = pricing();

    return {
      version: 2,
      origin: search.origin,
      destination: search.destination,
      tripType: search.tripType,
      departureDate:
        selectedOutbound?.departureDate || search.departureDate,
      returnDate: search.tripType === "Round trip"
        ? (selectedReturn?.departureDate || search.returnDate)
        : null,
      stops: search.stops,
      maximumBudget: search.maximumBudget,
      dateFlexibility: search.dateFlexibility,
      additionalPreferences: search.additionalPreferences,
      passengers: {
        adults: search.adults,
        children: search.children,
        infants: search.infants
      },
      cabin: search.cabin,
      outbound: selectedOutbound,
      return: selectedReturn,
      pricing: p,
      priceSource: "illustrative_demo",
      savedAt: new Date().toISOString()
    };
  }

  // =========================================================
  // 09. FLIGHT CARD GENERATOR
  // =========================================================

  function airlineInitials(name) {
    return String(name || "")
      .split(/\s+/)
      .map(word => word[0])
      .join("")
      .slice(0, 3)
      .toUpperCase();
  }

  function optionsMarkup(items, leg) {
    return items.map((o, index) => {
      const stopText = o.stops === 0
        ? "NON-STOP"
        : o.stops + (o.stops === 1 ? " STOP" : " STOPS");

      const stopClass = o.stops === 0
        ? "highlight"
        : "warning";

      const dateText = formatDate(o.departureDate);

      return (
        '<article class="flight-result-card tq-leg-card">' +

          '<div class="tq-card-top">' +

            '<div class="tq-airline-block">' +
              '<div class="tq-airline-mark">' +
                safe(airlineInitials(o.airline)) +
              '</div>' +

              '<div>' +
                '<div class="tq-airline-name">' +
                  safe(o.airline) +
                '</div>' +

                '<div class="tq-flight-code">' +
                  safe(o.flight) +
                  ' &nbsp; / &nbsp; OPTION ' +
                  String(index + 1).padStart(2, "0") +
                '</div>' +
              '</div>' +
            '</div>' +

            '<div class="tq-price-block">' +
              '<span class="tq-price-label">Adult demo fare</span>' +
              '<strong class="tq-price-value">' +
                money(o.price) +
              '</strong>' +
              '<small class="tq-price-note">Per passenger · one leg</small>' +
            '</div>' +

          '</div>' +

          '<div class="tq-route-panel">' +

            '<div class="tq-route-end">' +
              '<div class="tq-route-time">' +
                safe(o.depart) +
              '</div>' +
              '<div class="tq-route-code">' +
                safe(o.origin.code || "—") +
              '</div>' +
              '<div class="tq-route-city">' +
                safe(o.origin.label) +
              '</div>' +
            '</div>' +

            '<div class="tq-route-middle">' +
              '<div class="tq-route-duration">' +
                durationText(o.duration) +
              '</div>' +
              '<div class="tq-route-track">' +
                '<span class="tq-route-plane">✈</span>' +
              '</div>' +
              '<span class="tq-stop-label">' +
                stopText +
              '</span>' +
            '</div>' +

            '<div class="tq-route-end">' +
              '<div class="tq-route-time">' +
                safe(o.arrive) +
              '</div>' +
              '<div class="tq-route-code">' +
                safe(o.destination.code || "—") +
              '</div>' +
              '<div class="tq-route-city">' +
                safe(o.destination.label) +
              '</div>' +
            '</div>' +

          '</div>' +

          '<div class="tq-card-tags">' +
            '<span class="tq-tag ' + stopClass + '">' +
              '✈ ' + stopText +
            '</span>' +
            '<span class="tq-tag highlight">' +
              '◷ ' + durationText(o.duration) +
            '</span>' +
            '<span class="tq-tag">' +
              '▣ ' + safe(dateText) +
            '</span>' +
            '<span class="tq-tag">' +
              'BAGGAGE · ' + safe(o.baggage) +
            '</span>' +
            '<span class="tq-tag">' +
              safe(search.cabin) +
            '</span>' +
          '</div>' +

          connectionMarkup(o) +

          '<div class="tq-card-footer">' +

            '<div class="tq-card-footer-info">' +
              '<span>TRAVEL QILA DEMO INVENTORY</span>' +
              '<span>·</span>' +
              '<span>' + safe(dateText) + '</span>' +
            '</div>' +

            '<button type="button" class="flight-select-leg" ' +
              'data-select-leg="' + leg + '" ' +
              'data-offer-id="' + safe(o.id) + '">' +
              'SELECT ' +
              (leg === "outbound" ? "DEPARTURE" : "RETURN") +
              ' FLIGHT →' +
            '</button>' +

          '</div>' +

        '</article>'
      );
    }).join("");
  }

  // =========================================================
  // 10. FILTER CONTROLS
  // =========================================================

  function filtersMarkup() {
    return '<div class="flight-results-tools">' +

      '<label for="resultStops">Stops</label>' +
      '<select id="resultStops">' +
        '<option value="any" ' +
          (resultFilters.stops === "any" ? "selected" : "") +
        '>Any stops</option>' +
        '<option value="nonstop" ' +
          (resultFilters.stops === "nonstop" ? "selected" : "") +
        '>Non-stop</option>' +
        '<option value="one" ' +
          (resultFilters.stops === "one" ? "selected" : "") +
        '>Up to 1 stop</option>' +
        '<option value="two" ' +
          (resultFilters.stops === "two" ? "selected" : "") +
        '>Up to 2 stops</option>' +
      '</select>' +

      '<label for="resultAirline">Airline</label>' +
      '<select id="resultAirline">' +
        '<option value="all" ' +
          (resultFilters.airline === "all" ? "selected" : "") +
        '>All airlines</option>' +
        '<option value="IndiGo" ' +
          (resultFilters.airline === "IndiGo" ? "selected" : "") +
        '>IndiGo</option>' +
        '<option value="Air India" ' +
          (resultFilters.airline === "Air India" ? "selected" : "") +
        '>Air India</option>' +
        '<option value="Akasa Air" ' +
          (resultFilters.airline === "Akasa Air" ? "selected" : "") +
        '>Akasa Air</option>' +
        '<option value="Air India Express" ' +
          (resultFilters.airline === "Air India Express" ? "selected" : "") +
        '>Air India Express</option>' +
      '</select>' +

      '<label for="resultSort">Sort by</label>' +
      '<select id="resultSort">' +
        '<option value="price" ' +
          (resultFilters.sort === "price" ? "selected" : "") +
        '>Lowest fare</option>' +
        '<option value="duration" ' +
          (resultFilters.sort === "duration" ? "selected" : "") +
        '>Shortest duration</option>' +
        '<option value="departure" ' +
          (resultFilters.sort === "departure" ? "selected" : "") +
        '>Departure time</option>' +
      '</select>' +

      '<span class="small text-muted">' +
        'Budget: ' + money(search.maximumBudget) +
        ' average per passenger' +
      '</span>' +

    '</div>';
  }

  // =========================================================
  // 11. FILTER AND SORT ENGINE
  // =========================================================

  function estimatedAverageFare(outbound, returning) {
    const p = pricing(outbound, returning);

    return p.averageFarePerPassenger;
  }

  function filteredOptions(items, leg) {
    const stops = resultFilters.stops;
    const airline = resultFilters.airline;
    const sort = resultFilters.sort;

    const preference = search.stops || "Any";
    const max = Number(search.maximumBudget) || Infinity;

    const stopAllowed = o =>
      (preference === "Any" ||
        (preference === "Non-stop only" && o.stops === 0) ||
        (preference === "1 stop or fewer" && o.stops <= 1)) &&
      (stops === "any" ||
        (stops === "nonstop" && o.stops === 0) ||
        (stops === "one" && o.stops <= 1) ||
        (stops === "two" && o.stops <= 2));

    const out = items.filter(o => {
      if (!stopAllowed(o)) return false;

      if (airline !== "all" && o.airline !== airline) {
        return false;
      }

      let proposedAverage;

      if (leg === "return") {
        proposedAverage = estimatedAverageFare(
          selectedOutbound,
          o
        );
      } else if (search.tripType === "Round trip") {
        const cheapestReturn = returnOptions
          .filter(r => stopAllowed(r))
          .filter(r => airline === "all" || r.airline === airline)
          .sort((a, b) => a.price - b.price)[0];

        if (!cheapestReturn) return false;

        proposedAverage = estimatedAverageFare(
          o,
          cheapestReturn
        );
      } else {
        proposedAverage = estimatedAverageFare(o, null);
      }

      return proposedAverage <= max;
    });

    if (sort === "duration") {
      out.sort((a, b) =>
        (a.duration - b.duration) ||
        (a.price - b.price) ||
        a.depart.localeCompare(b.depart)
      );
    } else if (sort === "departure") {
      out.sort((a, b) =>
        a.depart.localeCompare(b.depart) ||
        (a.duration - b.duration)
      );
    } else {
      out.sort((a, b) =>
        (a.price - b.price) ||
        (a.duration - b.duration)
      );
    }

    return out;
  }

  // =========================================================
  // 12. RESULTS HEADER AND STEPPER
  // =========================================================

  function heading(title, sub) {
    const route = byId("resultRoute");
    const dates = byId("resultDates");

    if (route) route.textContent = title;
    if (dates) dates.textContent = sub;
  }

  function resetFilters() {
    resultFilters = {
      stops: "any",
      airline: "all",
      sort: "price"
    };
  }

  function heroMarkup(title, subtitle, stats) {
    return '<section class="tq-results-hero">' +
      '<div class="tq-hero-kicker">TRAVEL QILA / FLIGHT COMMAND</div>' +
      '<h2 class="tq-hero-title">' +
        safe(title) +
        ' <span>ACTIVE.</span>' +
      '</h2>' +
      '<p class="tq-hero-subtitle">' +
        safe(subtitle) +
      '</p>' +
      '<div class="tq-hero-stats">' +
        stats.map(item =>
          '<div class="tq-hero-stat">' +
            '<strong>' + safe(item.value) + '</strong>' +
            '<small>' + safe(item.label) + '</small>' +
          '</div>'
        ).join("") +
      '</div>' +
    '</section>';
  }

  // =========================================================
  // 13. RENDER FLIGHT RESULTS
  // =========================================================

  function renderLegStage() {
    const isReturn = stage === "return";

    const items = filteredOptions(
      isReturn ? returnOptions : outboundOptions,
      isReturn ? "return" : "outbound"
    );

    const from = isReturn ? search.destination : search.origin;
    const to = isReturn ? search.origin : search.destination;

    heading(
      (isReturn
        ? "Choose your return flight"
        : "Choose your departure flight") +
      " · " + from.label + " → " + to.label,

      formatDate(
        isReturn ? search.returnDate : search.departureDate
      ) +
      " · " + search.tripType +
      " · " + passengers() + " passenger(s)"
    );

    const stepper =
      '<div class="tq-booking-steps">' +
        '<span class="' +
          (stage === "outbound" ? "is-active" : "is-done") +
        '">1. Departure</span>' +

        (search.tripType === "Round trip"
          ? '<span class="' +
              (stage === "return" ? "is-active" : "") +
            '">2. Return</span>'
          : "") +

        '<span>' +
          (search.tripType === "Round trip" ? "3" : "2") +
          '. Review & save</span>' +
      '</div>';

    const back = isReturn
      ? '<button type="button" class="btn btn-outline-secondary mb-3" data-back-outbound>' +
          '← Change departure flight</button>'
      : "";

    const hero = heroMarkup(
      isReturn ? "Return flight selection" : "Departure selection",
      from.label + " → " + to.label +
        " / " + formatDate(
          isReturn ? search.returnDate : search.departureDate
        ),
      [
        {
          value: items.length,
          label: "Available options"
        },
        {
          value: passengers(),
          label: "Passengers"
        },
        {
          value: search.stops,
          label: "Stop preference"
        }
      ]
    );

    const demoNotice =
      '<div class="tq-demo-notice">' +
        '<strong>DEMO INVENTORY:</strong> These are illustrative ' +
        'flight options, not live airline inventory. Prices, ' +
        'schedules and connections must be verified before booking.' +
      '</div>';

    byId("flightResultsList").innerHTML =
      hero +
      stepper +
      back +
      filtersMarkup() +
      demoNotice +
      (items.length
        ? optionsMarkup(
            items,
            isReturn ? "return" : "outbound"
          )
        : '<div class="tq-empty-state">' +
            '<strong>NO MATCHES FOUND</strong>' +
            'No flights match these filters. Adjust your search criteria.' +
          '</div>');

    byId("flightResultsEmpty").classList.remove("is-visible");
    byId("flightResultsList").hidden = false;

    ["resultStops", "resultAirline", "resultSort"].forEach(id => {
      byId(id)?.addEventListener("change", () => {
        resultFilters = {
          stops: byId("resultStops")?.value || "any",
          airline: byId("resultAirline")?.value || "all",
          sort: byId("resultSort")?.value || "price"
        };

        renderLegStage();
      });
    });

    byId("flightResultsCount").textContent =
      items.length + " demo flight options";
  }

  // =========================================================
  // 14. FARE BREAKDOWN
  // =========================================================

  function fareBreakdownMarkup(p) {
    const rows = p.categories
      .filter(item => item.count > 0)
      .map(item => {
        const tripFarePerPerson =
          item.outboundPerPerson + item.returnPerPerson;

        return '<div class="tq-fare-category">' +
          '<div>' +
            '<strong>' +
              item.label + ' (' + item.count + ')' +
            '</strong>' +
            '<small>' +
              item.count + ' × ' +
              money(tripFarePerPerson) +
              ' per passenger' +
              (search.tripType === "Round trip"
                ? ' · outbound + return'
                : ' · one way') +
            '</small>' +
          '</div>' +
          '<strong>' + money(item.subtotal) + '</strong>' +
        '</div>';
      }).join("");

    return '<div class="tq-price-breakdown">' +
      '<h5 class="mb-3">PASSENGER FARE BREAKDOWN</h5>' +

      (rows || '<div>No passengers selected.</div>') +

      '<hr>' +

      '<div>' +
        '<span>Base fare · all passengers</span>' +
        '<strong>' + money(p.baseFare) + '</strong>' +
      '</div>' +

      '<div>' +
        '<span>Estimated taxes & fees (5%)</span>' +
        '<strong>' + money(p.taxAmount) + '</strong>' +
      '</div>' +

      '<div class="tq-grand-total">' +
        '<span>ESTIMATED TOTAL</span>' +
        '<strong>' + money(p.totalFare) + '</strong>' +
      '</div>' +

      '<div class="small text-muted mt-2">' +
        'Demo pricing assumptions: adults 100%, children 75%, ' +
        'infants 25% of the adult demo fare. These are not actual ' +
        'airline fare rules. Final fares, taxes and availability ' +
        'must be reconfirmed before payment.' +
      '</div>' +
    '</div>';
  }

  // =========================================================
  // 15. SUMMARY AND REVIEW SCREEN
  // =========================================================

  function renderSummary() {
    if (!selectedOutbound || !search) return;

    const trip = itinerary();
    const p = trip.pricing;

    const leg = (o, label) =>
      '<div class="tq-summary-leg">' +

        '<div class="tq-summary-leg-title">' +
          label + ' · ' + formatDate(o.departureDate) +
        '</div>' +

        '<strong>' +
          safe(o.airline) + ' · ' + safe(o.flight) +
        '</strong>' +

        '<div class="tq-summary-route">' +
          safe(o.origin.label) + ' (' +
          safe(o.origin.code || "—") + ')' +
          ' → ' +
          safe(o.destination.label) + ' (' +
          safe(o.destination.code || "—") + ')' +
        '</div>' +

        '<div class="tq-summary-times">' +
          safe(o.depart) + ' – ' + safe(o.arrive) +
          ' · ' + durationText(o.duration) +
        '</div>' +

        connectionMarkup(o) +

        '<div class="tq-summary-fare">' +
          money(o.price) +
          ' adult demo fare per passenger' +
        '</div>' +

      '</div>';

    const legs =
      leg(selectedOutbound, "Outbound") +
      (selectedReturn
        ? leg(selectedReturn, "Return")
        : "");

    const html =
      '<div class="tq-booking-steps">' +
        '<span class="is-done">1. Departure</span>' +
        (search.tripType === "Round trip"
          ? '<span class="is-done">2. Return</span>'
          : "") +
        '<span class="is-active">Review & save</span>' +
      '</div>' +

      '<div class="tq-summary-card">' +

        '<div class="tq-summary-heading">' +
          '<div>' +
            '<span class="flight-eyebrow text-primary">' +
              'YOUR ITINERARY / CONFIRMED SELECTION' +
            '</span>' +

            '<h3>' +
              safe(search.origin.label) + ' ↔ ' +
              safe(search.destination.label) +
            '</h3>' +

            '<p>' +
              search.tripType + ' · ' +
              passengers() + ' passenger(s) · ' +
              safe(search.cabin) +
            '</p>' +
          '</div>' +

          '<button type="button" class="btn btn-link" data-edit-flights>' +
            'Edit flights' +
          '</button>' +
        '</div>' +

        legs +

        fareBreakdownMarkup(p) +

        '<div class="tq-summary-actions">' +

          '<button type="button" class="btn btn-primary" data-book-itinerary>' +
            'Request booking' +
          '</button>' +

          '<button type="button" class="btn btn-outline-primary" data-save-wishlist>' +
            (wishlistId
              ? "Update saved trip"
              : "Save to wishlist") +
          '</button>' +

          '<button type="button" class="btn btn-outline-primary" data-share-itinerary="whatsapp">' +
            'WhatsApp' +
          '</button>' +

          '<button type="button" class="btn btn-outline-primary" data-share-itinerary="email">' +
            'Email' +
          '</button>' +

        '</div>' +

        '<p class="small text-muted mt-3 mb-0" data-itinerary-message>' +
          'Request a booking or save your selected itinerary.' +
        '</p>' +

      '</div>';

    byId("flightResultsList").innerHTML = html;

    byId("flightResultsCount").textContent =
      "Complete itinerary selected";

    byId("flightResultsEmpty").classList.remove("is-visible");
    byId("flightResultsList").hidden = false;

    heading(
      "Review your trip",
      formatDate(search.departureDate) +
      (search.tripType === "Round trip"
        ? " · Return " + formatDate(search.returnDate)
        : " · One way")
    );
  }

  function showStage() {
    if (!search) return;

    if (stage === "summary") {
      renderSummary();
    } else {
      renderLegStage();
    }
  }

  // =========================================================
  // 16. CURRENCY EVENT
  // =========================================================

  document.addEventListener(
    "travelqila:currency-changed",
    () => {
      const budget = byId("maxPrice");
      const budgetOutput = byId("priceOutput");

      if (budget && budgetOutput) {
        budgetOutput.textContent = money(budget.value);
      }

      if (search) {
        showStage();
      }
    }
  );

  // =========================================================
  // 17. AUTHENTICATION
  // =========================================================

  async function signedInUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error) throw error;

    if (!data.user) {
      throw new Error(
        "Please sign in to save or request this itinerary."
      );
    }

    return data.user;
  }

  function messageNode() {
    return byId("itinerary-message") ||
      document.querySelector("[data-itinerary-message]");
  }

  // =========================================================
  // 18. WISHLIST
  // =========================================================

  async function saveWishlist(button) {
    const node = messageNode();
    const original = button?.innerHTML;

    if (button) {
      button.disabled = true;
      button.textContent = "Saving...";
    }

    try {
      const user = await signedInUser();
      const trip = itinerary();

      const title =
        search.origin.label + " to " + search.destination.label;

      if (wishlistId) {
        const { data, error } = await supabase
          .from("flight_wishlists")
          .update({
            title,
            itinerary: trip
          })
          .eq("id", wishlistId)
          .eq("user_id", user.id)
          .select("id")
          .single();

        if (error) throw error;

        if (!data) {
          throw new Error("Could not update this saved trip.");
        }
      } else {
        const { data, error } = await supabase
          .from("flight_wishlists")
          .insert({
            user_id: user.id,
            title,
            itinerary: trip
          })
          .select("id")
          .single();

        if (error) throw error;

        wishlistId = data.id;
      }

      if (node) {
        node.replaceChildren(
          document.createTextNode(
            "Your itinerary and passenger fare breakdown have been saved. "
          )
        );

        const viewWishlistLink = document.createElement("a");

        viewWishlistLink.href = "dashboard.html#wishlist";
        viewWishlistLink.className =
          "btn btn-sm btn-outline-primary ms-2";
        viewWishlistLink.textContent = "View Wishlist";

        viewWishlistLink.setAttribute(
          "aria-label",
          "View your saved flight wishlist"
        );

        node.appendChild(viewWishlistLink);
      }

      if (button) {
        button.textContent = "Saved successfully";
        button.disabled = false;
      }
    } catch (error) {
      console.error("Wishlist error:", error);

      if (node) node.textContent = error.message;

      if (button) {
        button.disabled = false;
        button.innerHTML = original;
      }
    }
  }

  // =========================================================
  // 19. BOOKING REQUEST
  // =========================================================

  async function requestBooking(trip, user) {
    const o = trip.outbound;
    const r = trip.return;
    const p = trip.pricing;

    const payload = {
      user_id: user.id,
      origin: trip.origin.label,
      destination: trip.destination.label,
      origin_code: trip.origin.code || null,
      destination_code: trip.destination.code || null,
      trip_type: trip.tripType,
      departure_date: trip.departureDate,
      return_date:
        trip.tripType === "Round trip" ? trip.returnDate : null,
      adults: trip.passengers.adults,
      children: trip.passengers.children,
      infants: trip.passengers.infants,
      cabin_class: trip.cabin,
      airline: o.airline,
      flight_number: o.flight,
      departure_time: o.depart,
      arrival_time: o.arrive,
      return_airline: r?.airline || null,
      return_flight_number: r?.flight || null,
      return_departure_time: r?.depart || null,
      return_arrival_time: r?.arrive || null,
      base_fare: p.baseFare,
      tax_amount: p.taxAmount,
      demo_fare: p.totalFare,
      additional_preferences:
        trip.additionalPreferences || null
    };

    const { data, error } = await supabase
      .from("flight_bookings")
      .insert(payload)
      .select("booking_reference")
      .single();

    if (error) throw error;

    return data.booking_reference;
  }

  async function bookCurrent(button) {
    const node = messageNode();

    button.disabled = true;
    button.textContent = "Submitting...";

    try {
      const user = await signedInUser();
      const ref = await requestBooking(itinerary(), user);

      if (node) {
        node.textContent =
          "Booking request " + ref +
          " has been submitted. Travel Qila must reconfirm live " +
          "availability and final fare before ticketing.";
      }

      button.textContent = "Request submitted";
    } catch (error) {
      console.error("Booking request error:", error);

      if (node) node.textContent = error.message;

      button.disabled = false;
      button.textContent = "Request booking";
    }
  }

  // =========================================================
  // 20. ITINERARY SHARING
  // =========================================================

  function shareItinerary(channel) {
    const trip = itinerary();
    const p = trip.pricing;
    const o = trip.outbound;
    const r = trip.return;

    const lines = [
      "Hello Travel Qila, I would like to request this flight itinerary.",
      "Trip: " + trip.tripType,
      "Route: " + trip.origin.label + " to " +
        trip.destination.label,
      "Departure: " + formatDate(trip.departureDate),

      trip.tripType === "Round trip"
        ? "Return: " + formatDate(trip.returnDate)
        : "",

      "Passengers: " +
        trip.passengers.adults + " adult(s), " +
        trip.passengers.children + " child(ren), " +
        trip.passengers.infants + " infant(s)",

      "Cabin: " + trip.cabin,

      "Outbound: " + o.airline + " " + o.flight +
        " | " + money(o.price) + " adult demo fare",

      o.layovers?.length
        ? "Outbound connections: " +
          o.layovers.map(stop =>
            (stop.airport.city || stop.airport.code) +
            " (" + durationText(stop.duration) + " layover)"
          ).join(", ")
        : "Outbound: Non-stop",

      r ? "Return: " + r.airline + " " + r.flight +
        " | " + money(r.price) + " adult demo fare" : "",

      r?.layovers?.length
        ? "Return connections: " +
          r.layovers.map(stop =>
            (stop.airport.city || stop.airport.code) +
            " (" + durationText(stop.duration) + " layover)"
          ).join(", ")
        : (r ? "Return: Non-stop" : ""),

      "Passenger category breakdown:",

      ...p.categories
        .filter(item => item.count > 0)
        .map(item =>
          item.label + " (" + item.count + "): " +
          money(item.subtotal)
        ),

      "Base fare: " + money(p.baseFare),
      "Estimated tax: " + money(p.taxAmount),
      "Estimated total: " + money(p.totalFare),

      "This is a demo estimate and not a confirmed ticket."
    ].filter(Boolean);

    const message = lines.join("\n");

    if (channel === "whatsapp") {
      window.open(
        "https://wa.me/919871101345?text=" +
          encodeURIComponent(message),
        "_blank",
        "noopener,noreferrer"
      );
    }

    if (channel === "email") {
      window.location.href =
        "mailto:info@travelqila.com?subject=" +
        encodeURIComponent(
          "Travel Qila - Flight booking enquiry"
        ) +
        "&body=" + encodeURIComponent(message);
    }
  }

  // =========================================================
  // 21. CENTRAL RESULTS EVENT HANDLER
  // =========================================================

  results.addEventListener("click", async event => {
    const target = event.target.closest("button");

    if (!target) return;

    if (target.hasAttribute("data-select-leg")) {
      const id = target.dataset.offerId;
      const leg = target.dataset.selectLeg;

      const options =
        leg === "return" ? returnOptions : outboundOptions;

      const selected = options.find(x => x.id === id);

      if (!selected) return;

      if (leg === "outbound") {
        selectedOutbound = selected;

        if (search.tripType === "Round trip") {
          stage = "return";
          resetFilters();
        } else {
          selectedReturn = null;
          stage = "summary";
        }
      } else {
        selectedReturn = selected;
        stage = "summary";
      }

      showStage();

      results.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    } else if (target.hasAttribute("data-back-outbound")) {
      stage = "outbound";
      selectedReturn = null;

      resetFilters();
      showStage();

    } else if (target.hasAttribute("data-edit-flights")) {
      stage =
        selectedOutbound && search.tripType === "Round trip"
          ? "return"
          : "outbound";

      resetFilters();
      showStage();

    } else if (target.hasAttribute("data-save-wishlist")) {
      await saveWishlist(target);

    } else if (target.hasAttribute("data-book-itinerary")) {
      await bookCurrent(target);

    } else if (target.hasAttribute("data-share-itinerary")) {
      shareItinerary(target.dataset.shareItinerary);
    }
  });

  // =========================================================
  // 22. TRIP TYPE CONTROLS
  // =========================================================

  function updateTripType() {
    const selectedTrip =
      form.querySelector('input[name="tripType"]:checked');

    if (!selectedTrip) return;

    const round = selectedTrip.value === "Round trip";

    const wrap = byId("returnDate");
    const container = byId("returnDateWrap");

    if (!wrap || !container) return;

    container.hidden = !round;
    wrap.required = round;

    if (!round) wrap.value = "";
  }

  form.querySelectorAll('input[name="tripType"]').forEach(input =>
    input.addEventListener("change", updateTripType)
  );

  // =========================================================
  // 23. PASSENGER FIELD EVENTS
  // =========================================================

  byId("adults")?.addEventListener("input", () => {
    syncInfantLimit();
  });

  byId("infants")?.addEventListener("change", () => {
    byId("infants").setCustomValidity("");
  });

  // =========================================================
  // 24. DATE CONTROLS
  // =========================================================

  byId("departDate")?.addEventListener("change", () => {
    const departure = byId("departDate");
    const returning = byId("returnDate");

    if (departure && returning) {
      returning.min = departure.value;
    }
  });

  // =========================================================
  // 25. CITY SWAP
  // =========================================================

  byId("swapCities")?.addEventListener("click", () => {
    const origin = byId("origin");
    const destination = byId("destination");

    if (!origin || !destination) return;

    const value = origin.value;

    origin.value = destination.value;
    destination.value = value;
  });

  // =========================================================
  // 26. MAIN SEARCH SUBMISSION
  // =========================================================

  form.addEventListener("submit", event => {
    event.preventDefault();

    updateTripType();

    [
      byId("adults"),
      byId("children"),
      byId("infants")
    ].forEach(input => input?.setCustomValidity(""));

    const passengerCounts = validatePassengerCounts();

    if (!passengerCounts) return;

    syncInfantLimit();

    if (!form.reportValidity()) return;

    const origin = parseAirport(byId("origin").value);
    const destination = parseAirport(byId("destination").value);

    if (
      origin.city.toLowerCase() === destination.city.toLowerCase() ||
      (origin.code && origin.code === destination.code)
    ) {
      byId("destination").setCustomValidity(
        "Choose a different arrival airport."
      );

      byId("destination").reportValidity();
      byId("destination").setCustomValidity("");

      return;
    }

    const {
      adults,
      children,
      infants
    } = passengerCounts;

    const tripType =
      form.querySelector('input[name="tripType"]:checked')?.value;

    if (!tripType) {
      alert("Please select a trip type.");
      return;
    }

    if (
      tripType === "Round trip" &&
      byId("returnDate").value < byId("departDate").value
    ) {
      byId("returnDate").setCustomValidity(
        "Return date must be on or after the departure date."
      );

      byId("returnDate").reportValidity();
      byId("returnDate").setCustomValidity("");

      return;
    }

    search = {
      origin,
      destination,
      departureDate: byId("departDate").value,

      returnDate: tripType === "Round trip"
        ? byId("returnDate").value
        : null,

      tripType,
      adults,
      children,
      infants,
      cabin: byId("cabin").value,
      stops: byId("stops").value,
      maximumBudget: Number(byId("maxPrice").value),
      dateFlexibility: byId("flexibility").value,
      additionalPreferences: byId("notes").value.trim()
    };

    selectedOutbound = null;
    selectedReturn = null;
    wishlistId = null;
    stage = "outbound";

    resultFilters = {
      stops:
        search.stops === "Non-stop only"
          ? "nonstop"
          : search.stops === "1 stop or fewer"
            ? "one"
            : "any",
      airline: "all",
      sort: "price"
    };

    outboundOptions = makeOptions(
      origin,
      destination,
      search.departureDate,
      origin.code + destination.code
    );

    returnOptions = tripType === "Round trip"
      ? makeOptions(
          destination,
          origin,
          search.returnDate,
          destination.code + origin.code
        )
      : [];

    byId("flightResultsCount").textContent =
      "Choose your departure flight";

    results.hidden = false;

    showStage();

    results.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  // =========================================================
  // 27. URL PARAMETERS
  // =========================================================

  const params = new URLSearchParams(window.location.search);

  wishlistId = params.get("wishlistId") || null;

  if (params.has("origin") && params.has("destination")) {
    byId("origin").value = params.get("origin") || "";
    byId("destination").value = params.get("destination") || "";

    const trip = params.get("tripType") === "Round trip"
      ? "Round trip"
      : "One way";

    const radio = form.querySelector(
      'input[name="tripType"][value="' + trip + '"]'
    );

    if (radio) radio.checked = true;

    byId("departDate").value =
      params.get("departureDate") || "";

    byId("returnDate").value =
      params.get("returnDate") || "";

    ["adults", "children", "infants"].forEach(id => {
      const value = params.get(id);

      if (value !== null && byId(id)) {
        byId(id).value = value;
      }
    });

    if (params.get("cabin")) {
      byId("cabin").value = params.get("cabin");
    }
  }

  // =========================================================
  // 28. DATE INITIALIZATION
  // =========================================================

  const now = new Date();

  now.setMinutes(
    now.getMinutes() - now.getTimezoneOffset()
  );

  const today = now.toISOString().slice(0, 10);

  byId("departDate").min = today;
  byId("returnDate").min = today;

  // =========================================================
  // 29. BUDGET DISPLAY
  // =========================================================

  const budget = byId("maxPrice");
  const budgetOutput = byId("priceOutput");

  const syncBudget = () => {
    if (budgetOutput && budget) {
      budgetOutput.textContent = money(budget.value);
    }
  };

  if (budget) {
    budget.addEventListener("input", syncBudget);
  }

  // =========================================================
  // 30. RESTORE SEARCH PARAMETERS
  // =========================================================

  if (params.has("stops") && byId("stops")) {
    byId("stops").value = params.get("stops");
  }

  if (params.has("maximumBudget") && budget) {
    budget.value = params.get("maximumBudget");
  }

  if (params.has("dateFlexibility") && byId("flexibility")) {
    byId("flexibility").value =
      params.get("dateFlexibility");
  }

  if (params.has("additionalPreferences") && byId("notes")) {
    byId("notes").value =
      params.get("additionalPreferences");
  }

  // =========================================================
  // 31. FINAL INITIALIZATION
  // =========================================================

  syncInfantLimit();
  syncBudget();
  updateTripType();

  if (byId("departDate").value) {
    byId("returnDate").min = byId("departDate").value;
  }

  // =========================================================
  // 32. AUTO-SEARCH FROM URL
  // =========================================================

  if (
    params.has("origin") &&
    params.has("destination") &&
    params.has("departureDate")
  ) {
    const validOrigin = byId("origin").value.trim();
    const validDestination = byId("destination").value.trim();
    const validDeparture = byId("departDate").value;

    const selectedTrip =
      form.querySelector('input[name="tripType"]:checked');

    const validReturn =
      selectedTrip?.value !== "Round trip" ||
      !!byId("returnDate").value;

    if (
      validOrigin &&
      validDestination &&
      validDeparture &&
      validReturn
    ) {
      form.requestSubmit();
    }
  }

})();
