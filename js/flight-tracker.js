
import { supabase } from "./auth-client.js";

(() => {
    "use strict";

    const form = document.getElementById("flightTrackerForm");
    const input = document.getElementById("flightNumber");
    const button = document.getElementById("trackFlightBtn");
    const results = document.getElementById("flightResults");
    const message = document.getElementById("trackerMessage");
    const subtitle = document.getElementById("trackerSubtitle");
    const resultCount = document.getElementById("resultCount");

    if (!form || !input || !button || !results) return;

    const FUNCTION_NAME = "flight-tracker";

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);
    }

    function showMessage(text, type = "info") {
        message.className = `tracker-message show alert alert-${type}`;
        message.textContent = text;
    }

    function hideMessage() {
        message.className = "tracker-message";
        message.textContent = "";
    }

    function setLoading(loading) {
        button.disabled = loading;
        button.innerHTML = loading
            ? '<span class="spinner-border spinner-border-sm me-2"></span>Searching...'
            : '<i class="fas fa-search me-2"></i>Track Flight';
    }

    function formatDate(value) {
        if (!value) return "Not available";

        const date = new Date(`${value}T00:00:00`);

        if (Number.isNaN(date.getTime())) return value;

        return new Intl.DateTimeFormat("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }).format(date);
    }

    function formatTime(value) {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return value;

        return new Intl.DateTimeFormat("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "UTC"
        }).format(date) + " UTC";
    }

    function formatStatus(status) {
        if (!status) return "Status unavailable";

        return String(status)
            .replace(/[_-]/g, " ")
            .replace(/\b\w/g, letter => letter.toUpperCase());
    }

    function statusClass(status) {
        const normalized = String(status || "").toLowerCase();

        if (normalized.includes("landed")) return "status-landed";
        if (normalized.includes("arrived")) return "status-arrived";
        if (normalized.includes("active")) return "status-active";
        if (normalized.includes("en-route") || normalized.includes("en route")) return "status-en-route";
        if (normalized.includes("scheduled")) return "status-scheduled";
        if (normalized.includes("boarding")) return "status-boarding";
        if (normalized.includes("cancelled")) return "status-cancelled";
        if (normalized.includes("diverted")) return "status-diverted";

        return "";
    }

    function getValue(value, suffix = "") {
        if (value === null || value === undefined || value === "") {
            return "Not available";
        }

        return `${value}${suffix}`;
    }

    function renderFlight(flight) {
        const departure = flight.departure || {};
        const arrival = flight.arrival || {};
        const airline = flight.airline || {};
        const flightInfo = flight.flight || {};

        const flightNumber = flightInfo.iata ||
            [flightInfo.iata, flightInfo.number].filter(Boolean).join(" ") ||
            "Flight";

        const status = flight.flight_status || "Unknown";
        const departureCode = departure.iata || departure.icao || "—";
        const arrivalCode = arrival.iata || arrival.icao || "—";

        const departureDelay = departure.delay;
        const arrivalDelay = arrival.delay;

        const live = flight.live || null;
        const liveDetails = live
            ? `
                <div class="detail-box">
                    <span class="detail-label">Live Altitude</span>
                    <span class="detail-value">${getValue(live.altitude, " m")}</span>
                </div>
                <div class="detail-box">
                    <span class="detail-label">Live Speed</span>
                    <span class="detail-value">${getValue(live.speed_horizontal, " km/h")}</span>
                </div>
                <div class="detail-box">
                    <span class="detail-label">Live Direction</span>
                    <span class="detail-value">${getValue(live.direction, "°")}</span>
                </div>
                <div class="detail-box">
                    <span class="detail-label">Live Position</span>
                    <span class="detail-value">${
                        live.latitude != null && live.longitude != null
                            ? `${escapeHTML(live.latitude)}, ${escapeHTML(live.longitude)}`
                            : "Not available"
                    }</span>
                </div>
            `
            : "";

        return `
            <article class="flight-card">
                <div class="flight-card-top">
                    <div>
                        <h5 class="mb-1">${escapeHTML(airline.name || "Airline not available")}</h5>
                        <span class="text-muted small">
                            ${escapeHTML(flightNumber)}
                            ${flight.aircraft?.registration ? ` · ${escapeHTML(flight.aircraft.registration)}` : ""}
                        </span>
                    </div>

                    <div class="text-end">
                        <span class="flight-status ${statusClass(status)}">
                            ${escapeHTML(formatStatus(status))}
                        </span>
                        <div class="small text-muted mt-2">
                            ${escapeHTML(formatDate(flight.flight_date))}
                        </div>
                    </div>
                </div>

                <div class="flight-route">
                    <div class="route-airport">
                        <div class="route-time">${escapeHTML(formatTime(departure.scheduled))}</div>
                        <div class="route-code">${escapeHTML(departureCode)}</div>
                        <div class="small text-muted">${escapeHTML(departure.airport || "Departure airport")}</div>
                        <div class="small text-muted">${escapeHTML(departure.timezone || "")}</div>
                    </div>

                    <div class="route-line">
                        <i class="fas fa-plane"></i>
                        <span>Flight route</span>
                    </div>

                    <div class="route-airport">
                        <div class="route-time">${escapeHTML(formatTime(arrival.scheduled))}</div>
                        <div class="route-code">${escapeHTML(arrivalCode)}</div>
                        <div class="small text-muted">${escapeHTML(arrival.airport || "Arrival airport")}</div>
                        <div class="small text-muted">${escapeHTML(arrival.timezone || "")}</div>
                    </div>
                </div>

                <div class="flight-details">
                    <div class="detail-box">
                        <span class="detail-label">Departure Terminal</span>
                        <span class="detail-value">${escapeHTML(getValue(departure.terminal))}</span>
                    </div>
                    <div class="detail-box">
                        <span class="detail-label">Departure Gate</span>
                        <span class="detail-value">${escapeHTML(getValue(departure.gate))}</span>
                    </div>
                    <div class="detail-box">
                        <span class="detail-label">Arrival Terminal</span>
                        <span class="detail-value">${escapeHTML(getValue(arrival.terminal))}</span>
                    </div>
                    <div class="detail-box">
                        <span class="detail-label">Arrival Gate</span>
                        <span class="detail-value">${escapeHTML(getValue(arrival.gate))}</span>
                    </div>

                    <div class="detail-box">
                        <span class="detail-label">Departure Delay</span>
                        <span class="detail-value">${escapeHTML(getValue(departureDelay, " min"))}</span>
                    </div>
                    <div class="detail-box">
                        <span class="detail-label">Arrival Delay</span>
                        <span class="detail-value">${escapeHTML(getValue(arrivalDelay, " min"))}</span>
                    </div>
                    <div class="detail-box">
                        <span class="detail-label">Baggage Belt</span>
                        <span class="detail-value">${escapeHTML(getValue(arrival.baggage))}</span>
                    </div>
                    <div class="detail-box">
                        <span class="detail-label">Aircraft</span>
                        <span class="detail-value">${escapeHTML(getValue(flight.aircraft?.iata))}</span>
                    </div>

                    ${liveDetails}
                </div>

                <div class="row mt-3 g-3">
                    <div class="col-md-6">
                        <small class="text-muted">
                            Estimated departure:
                            <strong>${escapeHTML(formatTime(departure.estimated))}</strong>
                        </small>
                    </div>
                    <div class="col-md-6">
                        <small class="text-muted">
                            Estimated arrival:
                            <strong>${escapeHTML(formatTime(arrival.estimated))}</strong>
                        </small>
                    </div>
                    <div class="col-md-6">
                        <small class="text-muted">
                            Actual departure:
                            <strong>${escapeHTML(formatTime(departure.actual))}</strong>
                        </small>
                    </div>
                    <div class="col-md-6">
                        <small class="text-muted">
                            Actual arrival:
                            <strong>${escapeHTML(formatTime(arrival.actual))}</strong>
                        </small>
                    </div>
                </div>
            </article>
        `;
    }

    function renderResults(flights, searchedFlight) {
        if (!Array.isArray(flights) || flights.length === 0) {
            results.innerHTML = `
                <div class="tracker-empty">
                    <i class="fas fa-plane-slash fa-3x text-muted mb-3"></i>
                    <h4>No flight records found</h4>
                    <p class="text-muted mb-0">
                        No records were returned for ${escapeHTML(searchedFlight)}.
                        Check the flight number and try again.
                    </p>
                </div>
            `;

            resultCount.textContent = "0 records";
            return;
        }

        // Sort newest flight date first; keep historical records identifiable by date.
        flights.sort((a, b) =>
            String(b.flight_date || "").localeCompare(String(a.flight_date || ""))
        );

        results.innerHTML = flights.map(renderFlight).join("");
        resultCount.textContent = `${flights.length} record${flights.length === 1 ? "" : "s"}`;

        subtitle.textContent = `Available records for ${searchedFlight}. Flight information may include scheduled and historical records.`;
    }

    async function searchFlight(flightNumber) {
        hideMessage();
        results.innerHTML = `
            <div class="tracker-loading">
                <div class="spinner-border text-primary mb-3" role="status"></div>
                <h5>Searching flight information...</h5>
                <p class="mb-0">Please wait while we retrieve available records.</p>
            </div>
        `;

        resultCount.textContent = "";
        subtitle.textContent = `Searching for ${flightNumber}...`;
        setLoading(true);

        try {
            const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
                body: {
                    flight_iata: flightNumber
                }
            });

            if (error) {
                throw new Error(error.message || "Unable to contact the flight tracking service.");
            }

            if (!data || data.success !== true) {
                throw new Error(data?.error || data?.message || "Flight search was unsuccessful.");
            }

            renderResults(data.results || [], flightNumber);

        } catch (error) {
            console.error("Flight tracker error:", error);

            results.innerHTML = `
                <div class="tracker-empty">
                    <i class="fas fa-exclamation-circle fa-3x text-danger mb-3"></i>
                    <h4>Unable to retrieve flight information</h4>
                    <p class="text-muted mb-0">Please try again in a moment.</p>
                </div>
            `;

            subtitle.textContent = "Search could not be completed.";
            showMessage(error.message || "Something went wrong. Please try again.", "danger");

        } finally {
            setLoading(false);
        }
    }

    form.addEventListener("submit", event => {
        event.preventDefault();

        const flightNumber = input.value
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "");

        if (!/^[A-Z0-9]{2,3}[0-9]{1,4}[A-Z]?$/.test(flightNumber)) {
            showMessage("Enter a valid flight number, for example AI101, 6E2145 or BR133.", "warning");
            input.focus();
            return;
        }

        input.value = flightNumber;
        searchFlight(flightNumber);
    });

    // Allow direct searches through ?flight=BR133
    const params = new URLSearchParams(window.location.search);
    const initialFlight = params.get("flight");

    if (initialFlight) {
        input.value = initialFlight.toUpperCase().replace(/\s+/g, "");
        form.requestSubmit();
    }
})();
