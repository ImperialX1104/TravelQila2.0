
(function ($) {
    "use strict";

    // =====================================================
    // 1. EXISTING SPINNER
    // =====================================================

    var spinner = function () {
        setTimeout(function () {
            if ($("#spinner").length > 0) {
                $("#spinner").removeClass("show");
            }
        }, 1);
    };

    spinner(0);


    // =====================================================
    // 2. EXISTING STICKY NAVBAR
    // =====================================================

    $(window).scroll(function () {
        if ($(this).scrollTop() > 45) {
            $(".navbar").addClass("sticky-top shadow-sm");
        } else {
            $(".navbar").removeClass("sticky-top shadow-sm");
        }
    });


    // =====================================================
    // 3. EXISTING INTERNATIONAL TOUR CAROUSEL
    // =====================================================

    $(".InternationalTour-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        center: false,
        dots: true,
        loop: true,
        margin: 25,
        nav: false,
        navText: [
            '<i class="bi bi-arrow-left"></i>',
            '<i class="bi bi-arrow-right"></i>'
        ],
        responsiveClass: true,
        responsive: {
            0: { items: 1 },
            768: { items: 2 },
            992: { items: 2 },
            1200: { items: 3 }
        }
    });


    // =====================================================
    // 4. EXISTING PACKAGES CAROUSEL
    // =====================================================

    $(".packages-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        center: false,
        dots: false,
        loop: true,
        margin: 25,
        nav: true,
        navText: [
            '<i class="bi bi-arrow-left"></i>',
            '<i class="bi bi-arrow-right"></i>'
        ],
        responsiveClass: true,
        responsive: {
            0: { items: 1 },
            768: { items: 2 },
            992: { items: 3 },
            1200: { items: 3 }
        }
    });


    // =====================================================
    // 5. EXISTING TESTIMONIAL CAROUSEL
    // =====================================================

    $(".testimonial-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        center: true,
        dots: true,
        loop: true,
        margin: 25,
        nav: true,
        navText: [
            '<i class="bi bi-arrow-left"></i>',
            '<i class="bi bi-arrow-right"></i>'
        ],
        responsiveClass: true,
        responsive: {
            0: { items: 1 },
            768: { items: 2 },
            992: { items: 2 },
            1200: { items: 3 }
        }
    });


    // =====================================================
    // 6. EXISTING BACK TO TOP
    // =====================================================

    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $(".back-to-top").fadeIn("slow");
        } else {
            $(".back-to-top").fadeOut("slow");
        }
    });

    $(".back-to-top").click(function () {
        $("html, body").animate(
            { scrollTop: 0 },
            1500,
            "easeInOutExpo"
        );
        return false;
    });


    // =====================================================
    // 7. TRAVEL QILA CURRENCY CONVERTER
    // =====================================================

    const CURRENCIES = {
        INR: { symbol: "₹", locale: "en-IN" },
        USD: { symbol: "$", locale: "en-US" },
        EUR: { symbol: "€", locale: "de-DE" },
        GBP: { symbol: "£", locale: "en-GB" }
    };

    const CURRENCY_FUNCTION = "exchange-rates";
    const STORAGE_KEY = "travelqila_currency";

    let exchangeRates = null;
    let currentCurrency = "INR";
    let supabaseClient = null;

    // Restore previous currency preference.
    try {
        const savedCurrency = localStorage.getItem(STORAGE_KEY);

        if (savedCurrency && CURRENCIES[savedCurrency]) {
            currentCurrency = savedCurrency;
        }
    } catch (error) {
        console.warn("Currency preference unavailable:", error);
    }

    // Load Supabase client without changing auth-client.js.
    async function initializeCurrency() {
        try {
            const module = await import("./auth-client.js");
            supabaseClient = module.supabase;

            const selector = document.getElementById("footerCurrency");

            if (selector) {
                selector.value = currentCurrency;

                selector.addEventListener("change", async function () {
                    const selected = this.value;

                    if (!CURRENCIES[selected]) return;

                    currentCurrency = selected;

                    try {
                        localStorage.setItem(STORAGE_KEY, selected);
                    } catch (error) {
                        console.warn("Unable to save currency preference.");
                    }

                    await loadExchangeRates();
                    updateDisplayedPrices();
                });
            }

            await loadExchangeRates();
            updateDisplayedPrices();

        } catch (error) {
            console.error("Currency initialization failed:", error);
        }
    }

    // Retrieve rates through the Supabase Edge Function.
    async function loadExchangeRates() {
        if (!supabaseClient) return false;

        try {
            const { data, error } = await supabaseClient.functions.invoke(
                CURRENCY_FUNCTION,
                { method: "GET" }
            );

            if (error) throw error;

            if (
                !data ||
                data.success !== true ||
                data.base !== "EUR" ||
                !data.rates
            ) {
                throw new Error("Invalid exchange-rate response.");
            }

            exchangeRates = data.rates;

            console.info(
                "Travel Qila exchange rates loaded:",
                data.cached ? "Cached" : "Fresh",
                data.date
            );

            return true;

        } catch (error) {
            console.error("Exchange-rate retrieval failed:", error);
            return false;
        }
    }

    // Convert any supported currency using EUR as the common base.
    function convertCurrency(amount, sourceCurrency, targetCurrency) {
        if (!exchangeRates) return null;

        const amountNumber = Number(amount);

        if (
            !Number.isFinite(amountNumber) ||
            !CURRENCIES[sourceCurrency] ||
            !CURRENCIES[targetCurrency]
        ) {
            return null;
        }

        const sourceRate = Number(exchangeRates[sourceCurrency]);
        const targetRate = Number(exchangeRates[targetCurrency]);

        if (
            !Number.isFinite(sourceRate) ||
            !Number.isFinite(targetRate) ||
            sourceRate <= 0 ||
            targetRate <= 0
        ) {
            return null;
        }

        return (amountNumber / sourceRate) * targetRate;
    }

    // Format currency for display.
    function formatCurrency(amount, currency) {
        return new Intl.NumberFormat(
            CURRENCIES[currency].locale,
            {
                style: "currency",
                currency: currency,
                maximumFractionDigits: 2
            }
        ).format(amount);
    }

    // Update all elements marked for currency conversion.
    function updateDisplayedPrices() {
        if (!exchangeRates) return;

        document.querySelectorAll("[data-price]").forEach(function (element) {
            const originalAmount = element.dataset.price;
            const originalCurrency =
                (element.dataset.currency || "INR").toUpperCase();

            const converted = convertCurrency(
                originalAmount,
                originalCurrency,
                currentCurrency
            );

            if (converted === null) return;

            element.textContent = formatCurrency(
                converted,
                currentCurrency
            );

            element.dataset.displayCurrency = currentCurrency;
        });

        document.dispatchEvent(
            new CustomEvent("travelqila:currency-changed", {
                detail: {
                    currency: currentCurrency,
                    rates: exchangeRates
                }
            })
        );
    }

    // Expose a small interface for other Travel Qila modules.
    window.TravelQilaCurrency = {
        getCurrency: function () {
            return currentCurrency;
        },

        getRates: function () {
            return exchangeRates;
        },

        convert: convertCurrency,

        format: formatCurrency,

        refresh: async function () {
            const success = await loadExchangeRates();

            if (success) updateDisplayedPrices();

            return success;
        },

        update: updateDisplayedPrices
    };

    initializeCurrency();

})(jQuery);
