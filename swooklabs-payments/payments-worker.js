const PRODUCT = {
    id: "zombie-game-full",
    name: "Zombie Game - Full Version",
    price: "4.99",
    currency: "USD"
};


const ALLOWED_ORIGINS =
    new Set([
        "https://swooklabs.com",
        "https://www.swooklabs.com"
    ]);


export default {

    async fetch(request, env)
    {
        const url =
            new URL(request.url);


        /*
         * CORS
         */
        if (
            request.method === "OPTIONS"
        )
        {
            return new Response(
                null,
                {
                    status: 204,

                    headers:
                        corsHeaders(
                            request
                        )
                }
            );
        }


        try
        {

            /*
             * PAYPAL PUBLIC CONFIG
             */
            if (
                request.method === "GET" &&
                url.pathname === "/config"
            )
            {
                return jsonResponse(
                    {
                        clientId:
                            env.PAYPAL_CLIENT_ID
                    },

                    200,

                    request
                );
            }



            /*
             * CREATE PAYPAL ORDER
             */
            if (
                request.method === "POST" &&
                url.pathname ===
                    "/paypal/create-order"
            )
            {
                requireAllowedOrigin(
                    request
                );


                const accessToken =
                    await getPayPalAccessToken(
                        env
                    );


                const apiBase =
                    paypalApiBase(env);


                const paypalResponse =
                    await fetch(

                        apiBase +
                        "/v2/checkout/orders",

                        {
                            method: "POST",

                            headers: {

                                "Authorization":
                                    "Bearer " +
                                    accessToken,

                                "Content-Type":
                                    "application/json",

                                "PayPal-Request-Id":
                                    crypto.randomUUID(),

                                "Prefer":
                                    "return=representation"
                            },


                            /*
                             * IMPORTANT:
                             *
                             * The server fixes the
                             * price at $4.99.
                             */
                            body:
                                JSON.stringify({

                                    intent:
                                        "CAPTURE",

                                    purchase_units:
                                        [
                                            {
                                                reference_id:
                                                    PRODUCT.id,

                                                description:
                                                    PRODUCT.name,

                                                custom_id:
                                                    PRODUCT.id,

                                                amount: {

                                                    currency_code:
                                                        PRODUCT.currency,

                                                    value:
                                                        PRODUCT.price
                                                }
                                            }
                                        ]
                                })
                        }
                    );


                const order =
                    await paypalResponse.json();


                if (
                    !paypalResponse.ok ||
                    !order.id
                )
                {
                    console.error(
                        "PayPal create-order error:",
                        order
                    );


                    return jsonResponse(
                        {
                            error:
                                "Could not create the PayPal order."
                        },

                        502,

                        request
                    );
                }


                return jsonResponse(
                    {
                        id: order.id
                    },

                    201,

                    request
                );
            }



            /*
             * CAPTURE PAYMENT
             */
            if (
                request.method === "POST" &&
                url.pathname ===
                    "/paypal/capture-order"
            )
            {
                requireAllowedOrigin(
                    request
                );


                const body =
                    await request.json();


                const orderID =
                    String(
                        body.orderID || ""
                    ).trim();


                if (
                    !/^[A-Z0-9]+$/.test(
                        orderID
                    )
                )
                {
                    return jsonResponse(
                        {
                            error:
                                "Invalid PayPal order ID."
                        },

                        400,

                        request
                    );
                }


                const accessToken =
                    await getPayPalAccessToken(
                        env
                    );


                const apiBase =
                    paypalApiBase(env);


                const paypalResponse =
                    await fetch(

                        apiBase +
                        "/v2/checkout/orders/" +
                        encodeURIComponent(
                            orderID
                        ) +
                        "/capture",

                        {
                            method: "POST",

                            headers: {

                                "Authorization":
                                    "Bearer " +
                                    accessToken,

                                "Content-Type":
                                    "application/json",

                                "PayPal-Request-Id":
                                    crypto.randomUUID(),

                                "Prefer":
                                    "return=representation"
                            },

                            body: "{}"
                        }
                    );


                const order =
                    await paypalResponse.json();


                if (!paypalResponse.ok)
                {
                    console.error(
                        "PayPal capture error:",
                        order
                    );


                    return jsonResponse(
                        {
                            error:
                                "PayPal could not capture the payment."
                        },

                        502,

                        request
                    );
                }


                const capture =
                    order.purchase_units &&
                    order.purchase_units[0] &&
                    order.purchase_units[0]
                        .payments &&
                    order.purchase_units[0]
                        .payments.captures &&
                    order.purchase_units[0]
                        .payments.captures[0];


                /*
                 * Verify:
                 *
                 * Payment COMPLETED
                 * Currency USD
                 * Amount $4.99
                 */
                const validPayment =
                    Boolean(

                        order.status ===
                            "COMPLETED" &&

                        capture &&

                        capture.status ===
                            "COMPLETED" &&

                        capture.amount &&

                        capture.amount
                            .currency_code ===
                            PRODUCT.currency &&

                        capture.amount.value ===
                            PRODUCT.price
                    );


                if (!validPayment)
                {
                    console.error(
                        "Unexpected payment result:",
                        order
                    );


                    return jsonResponse(
                        {
                            error:
                                "The payment was not completed for the expected amount."
                        },

                        409,

                        request
                    );
                }



                /*
                 * Generate temporary
                 * download permission.
                 *
                 * Valid for 4 hours.
                 */
                const token =
                    await createDownloadToken(

                        {
                            orderID:
                                orderID,

                            captureID:
                                capture.id,

                            exp:
                                Date.now() +
                                (
                                    4 *
                                    60 *
                                    60 *
                                    1000
                                )
                        },

                        env
                            .DOWNLOAD_TOKEN_SECRET
                    );


                const downloadUrl =
                    url.origin +
                    "/download?token=" +
                    encodeURIComponent(
                        token
                    );


                return jsonResponse(

                    {
                        status:
                            "COMPLETED",

                        downloadUrl:
                            downloadUrl
                    },

                    200,

                    request
                );
            }



            /*
             * PAID GAME DOWNLOAD
             */
            if (
                request.method === "GET" &&
                url.pathname === "/download"
            )
            {
                const token =
                    url.searchParams.get(
                        "token"
                    ) || "";


                const payload =
                    await verifyDownloadToken(

                        token,

                        env
                            .DOWNLOAD_TOKEN_SECRET
                    );


                if (
                    !payload ||
                    payload.exp < Date.now()
                )
                {
                    return new Response(
                        "This download link is invalid or has expired.",
                        {
                            status: 403
                        }
                    );
                }


                const objectKey =
                    env.PAID_GAME_OBJECT_KEY;


                if (!objectKey)
                {
                    return new Response(
                        "Paid game file is not configured.",
                        {
                            status: 500
                        }
                    );
                }


                /*
                 * Read directly from the
                 * PRIVATE R2 bucket.
                 */
                const object =
                    await env
                        .PAID_GAME_BUCKET
                        .get(

                            objectKey,

                            {
                                range:
                                    request.headers
                            }
                        );


                if (
                    !object ||
                    !("body" in object)
                )
                {
                    return new Response(
                        "Paid game file was not found.",
                        {
                            status: 404
                        }
                    );
                }


                const headers =
                    new Headers();


                object.writeHttpMetadata(
                    headers
                );


                const downloadName =
                    env
                        .PAID_GAME_DOWNLOAD_NAME ||

                    "Zombie-Game-Full-Setup.exe";


                headers.set(
                    "Content-Type",
                    "application/octet-stream"
                );


                headers.set(
                    "Content-Disposition",

                    'attachment; filename="' +
                    sanitizeFilename(
                        downloadName
                    ) +
                    '"'
                );


                headers.set(
                    "Cache-Control",
                    "private, no-store"
                );


                headers.set(
                    "ETag",
                    object.httpEtag
                );


                headers.set(
                    "Accept-Ranges",
                    "bytes"
                );


                let status = 200;


                /*
                 * Support resumed downloads
                 * for the large installer.
                 */
                if (object.range)
                {
                    const start =
                        object.range.offset;

                    const length =
                        object.range.length;

                    const end =
                        start +
                        length -
                        1;


                    status = 206;


                    headers.set(

                        "Content-Range",

                        "bytes " +
                        start +
                        "-" +
                        end +
                        "/" +
                        object.size
                    );


                    headers.set(
                        "Content-Length",
                        String(length)
                    );
                }
                else
                {
                    headers.set(
                        "Content-Length",
                        String(object.size)
                    );
                }


                return new Response(

                    object.body,

                    {
                        status:
                            status,

                        headers:
                            headers
                    }
                );
            }


            return new Response(
                "Not Found",
                {
                    status: 404
                }
            );
        }

        catch (error)
        {
            console.error(error);


            return jsonResponse(

                {
                    error:
                        "Something went wrong on the payment server."
                },

                500,

                request
            );
        }
    }
};



function paypalApiBase(env)
{
    return (
        env.PAYPAL_ENV === "live"

        ? "https://api-m.paypal.com"

        : "https://api-m.sandbox.paypal.com"
    );
}



async function getPayPalAccessToken(
    env
)
{
    if (
        !env.PAYPAL_CLIENT_ID ||
        !env.PAYPAL_CLIENT_SECRET
    )
    {
        throw new Error(
            "PayPal credentials are missing."
        );
    }


    const credentials =
        btoa(

            env.PAYPAL_CLIENT_ID +
            ":" +
            env.PAYPAL_CLIENT_SECRET
        );


    const response =
        await fetch(

            paypalApiBase(env) +
            "/v1/oauth2/token",

            {
                method: "POST",

                headers: {

                    "Authorization":
                        "Basic " +
                        credentials,

                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },

                body:
                    "grant_type=client_credentials"
            }
        );


    const data =
        await response.json();


    if (
        !response.ok ||
        !data.access_token
    )
    {
        console.error(
            "PayPal OAuth error:",
            data
        );


        throw new Error(
            "Could not authenticate with PayPal."
        );
    }


    return data.access_token;
}



function requireAllowedOrigin(
    request
)
{
    const origin =
        request.headers.get(
            "Origin"
        );


    if (
        !origin ||
        !ALLOWED_ORIGINS.has(
            origin
        )
    )
    {
        throw new Error(
            "Origin not allowed."
        );
    }
}



function corsHeaders(request)
{
    const headers =
        new Headers({

            "Access-Control-Allow-Methods":
                "GET, POST, OPTIONS",

            "Access-Control-Allow-Headers":
                "Content-Type",

            "Vary":
                "Origin"
        });


    const origin =
        request.headers.get(
            "Origin"
        );


    if (
        origin &&
        ALLOWED_ORIGINS.has(
            origin
        )
    )
    {
        headers.set(
            "Access-Control-Allow-Origin",
            origin
        );
    }


    return headers;
}



function jsonResponse(
    data,
    status,
    request
)
{
    const headers =
        corsHeaders(request);


    headers.set(
        "Content-Type",
        "application/json; charset=utf-8"
    );


    headers.set(
        "Cache-Control",
        "no-store"
    );


    return new Response(
        JSON.stringify(data),
        {
            status:
                status,

            headers:
                headers
        }
    );
}



async function createDownloadToken(
    payload,
    secret
)
{
    if (!secret)
    {
        throw new Error(
            "Download token secret is missing."
        );
    }


    const encodedPayload =
        base64UrlEncodeString(
            JSON.stringify(
                payload
            )
        );


    const key =
        await importHmacKey(
            secret,
            ["sign"]
        );


    const signature =
        await crypto.subtle.sign(

            "HMAC",

            key,

            new TextEncoder()
                .encode(
                    encodedPayload
                )
        );


    return (
        encodedPayload +
        "." +
        base64UrlEncodeBytes(
            new Uint8Array(
                signature
            )
        )
    );
}



async function verifyDownloadToken(
    token,
    secret
)
{
    if (!secret)
    {
        return null;
    }


    const parts =
        token.split(".");


    if (parts.length !== 2)
    {
        return null;
    }


    try
    {
        const key =
            await importHmacKey(
                secret,
                ["verify"]
            );


        const signature =
            base64UrlDecodeBytes(
                parts[1]
            );


        const valid =
            await crypto.subtle.verify(

                "HMAC",

                key,

                signature,

                new TextEncoder()
                    .encode(
                        parts[0]
                    )
            );


        if (!valid)
        {
            return null;
        }


        const json =
            base64UrlDecodeString(
                parts[0]
            );


        return JSON.parse(json);
    }

    catch (error)
    {
        return null;
    }
}



async function importHmacKey(
    secret,
    usages
)
{
    return crypto.subtle.importKey(

        "raw",

        new TextEncoder()
            .encode(secret),

        {
            name:
                "HMAC",

            hash:
                "SHA-256"
        },

        false,

        usages
    );
}



function base64UrlEncodeString(
    value
)
{
    return base64UrlEncodeBytes(

        new TextEncoder()
            .encode(value)
    );
}



function base64UrlDecodeString(
    value
)
{
    return new TextDecoder()
        .decode(
            base64UrlDecodeBytes(
                value
            )
        );
}



function base64UrlEncodeBytes(
    bytes
)
{
    let binary = "";


    for (
        let i = 0;
        i < bytes.length;
        i += 1
    )
    {
        binary +=
            String.fromCharCode(
                bytes[i]
            );
    }


    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}



function base64UrlDecodeBytes(
    value
)
{
    const normalized =
        value
            .replace(/-/g, "+")
            .replace(/_/g, "/");


    const padding =
        normalized.length % 4 === 0

        ? ""

        : "=".repeat(
            4 -
            (
                normalized.length %
                4
            )
        );


    const binary =
        atob(
            normalized +
            padding
        );


    const bytes =
        new Uint8Array(
            binary.length
        );


    for (
        let i = 0;
        i < binary.length;
        i += 1
    )
    {
        bytes[i] =
            binary.charCodeAt(i);
    }


    return bytes;
}



function sanitizeFilename(value)
{
    return String(value)
        .replace(
            /[\r\n"\\]/g,
            "_"
        );
}
