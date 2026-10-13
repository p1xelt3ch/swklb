/*
 * Swook Labs - Zombie Game PayPal checkout
 *
 * IMPORTANT:
 * After creating your Cloudflare Worker,
 * replace the URL below with the Worker URL.
 */

const PAYMENTS_API =
    "https://YOUR-WORKER.workers.dev";


const paypalContainer =
    document.getElementById(
        "paypal-button-container"
    );

const paymentStatus =
    document.getElementById(
        "payment-status"
    );


function setPaymentStatus(message, type)
{
    paymentStatus.textContent =
        message || "";

    paymentStatus.className =
        "payment-status";

    if (type)
    {
        paymentStatus.classList.add(
            "is-" + type
        );
    }
}


async function apiRequest(path, options)
{
    const response =
        await fetch(
            PAYMENTS_API + path,
            options
        );

    let data = {};

    try
    {
        data = await response.json();
    }
    catch (error)
    {
        // Generic error below will handle it.
    }


    if (!response.ok)
    {
        throw new Error(
            data.error ||
            "The payment service returned an error."
        );
    }

    return data;
}


function loadPayPalSdk(clientId)
{
    return new Promise(
        function(resolve, reject)
        {
            if (window.paypal)
            {
                resolve();
                return;
            }


            const script =
                document.createElement(
                    "script"
                );


            script.src =
                "https://www.paypal.com/sdk/js" +
                "?client-id=" +
                encodeURIComponent(clientId) +
                "&currency=USD" +
                "&intent=capture" +
                "&components=buttons";


            script.async = true;


            script.onload = resolve;


            script.onerror =
                function()
                {
                    reject(
                        new Error(
                            "Could not load PayPal checkout."
                        )
                    );
                };


            document.head.appendChild(
                script
            );
        }
    );
}


async function startPayPalCheckout()
{
    try
    {
        setPaymentStatus(
            "Loading secure checkout...",
            "loading"
        );


        const config =
            await apiRequest(
                "/config",
                {
                    method: "GET"
                }
            );


        if (!config.clientId)
        {
            throw new Error(
                "PayPal is not configured yet."
            );
        }


        await loadPayPalSdk(
            config.clientId
        );


        setPaymentStatus("");


        window.paypal.Buttons({

            style: {
                layout: "vertical",
                shape: "rect",
                label: "paypal"
            },


            /*
             * We DO NOT send the price
             * from the browser.
             *
             * The Worker decides that
             * Zombie Game costs $4.99.
             */
            createOrder:
                async function()
                {
                    setPaymentStatus(
                        "Creating your order...",
                        "loading"
                    );


                    const order =
                        await apiRequest(
                            "/paypal/create-order",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({
                                        product:
                                            "zombie-game-full"
                                    })
                            }
                        );


                    setPaymentStatus("");


                    return order.id;
                },


            onApprove:
                async function(data)
                {
                    try
                    {
                        setPaymentStatus(
                            "Payment approved. Preparing your download...",
                            "loading"
                        );


                        const result =
                            await apiRequest(
                                "/paypal/capture-order",
                                {
                                    method:
                                        "POST",

                                    headers: {
                                        "Content-Type":
                                            "application/json"
                                    },

                                    body:
                                        JSON.stringify({
                                            orderID:
                                                data.orderID
                                        })
                                }
                            );


                        if (
                            !result.downloadUrl
                        )
                        {
                            throw new Error(
                                "Payment completed, but the download link could not be created."
                            );
                        }


                        setPaymentStatus(
                            "Payment complete. Your download is starting...",
                            "success"
                        );


                        window.location.assign(
                            result.downloadUrl
                        );
                    }
                    catch (error)
                    {
                        console.error(
                            error
                        );

                        setPaymentStatus(
                            error.message,
                            "error"
                        );
                    }
                },


            onCancel:
                function()
                {
                    setPaymentStatus(
                        "Checkout cancelled. You have not been charged."
                    );
                },


            onError:
                function(error)
                {
                    console.error(
                        error
                    );

                    setPaymentStatus(
                        "PayPal checkout could not be completed. Please try again.",
                        "error"
                    );
                }

        }).render(
            "#paypal-button-container"
        );

    }
    catch (error)
    {
        console.error(error);

        setPaymentStatus(
            error.message,
            "error"
        );
    }
}


startPayPalCheckout();
