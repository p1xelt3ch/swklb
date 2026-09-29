var products = [
    {
        name: "CueFluence",
        category: "tool",
        description:
            "Analyze forex markets and get simple BUY or WAIT signals based on key technical indicators.",
        price: "$9.99/month",
        image: "img/cuefluence.png",
        url: "https://cuefluence.swooklabs.com/"
    },

    {
        name: "Game",
        category: "game",
        description:
            "A simple zombie survival shooter. Survive as long as you can.",
        price: "N/A",
        image: "img/game.png",
        url: "#"
    }
];

var productGrid =
    document.getElementById("productGrid");

var filterButtons =
    document.querySelectorAll(".filter");

function displayProducts(category)
{
    productGrid.innerHTML = "";

    products.forEach(function(product)
    {
        if (
            category === "all" ||
            product.category === category
        )
        {
            var card =
                document.createElement("article");

            card.className = "product-card";

            // Make whole card clickable
            card.setAttribute("role", "link");
            card.setAttribute("tabindex", "0");

            card.addEventListener("click", function()
            {
                window.location.href = product.url;
            });

            // Allow Enter key as well
            card.addEventListener("keydown", function(event)
            {
                if (event.key === "Enter")
                {
                    window.location.href = product.url;
                }
            });

            card.innerHTML = `
                <div class="product-image">
                    ${
                        product.image && product.image !== "#"
                        ? `<img
                            src="${product.image}"
                            alt="${product.name}"
                            style="
                                width:100%;
                                height:100%;
                                object-fit:cover;
                            "
                           >`
                        : "Product Image"
                    }
                </div>

                <div class="product-content">

                    <span class="product-category">
                        ${product.category}
                    </span>

                    <h3 class="product-title">
                        ${product.name}
                    </h3>

                    <p class="product-description">
                        ${product.description}
                    </p>

                    <div class="product-footer">

                        <span class="product-price">
                            ${product.price}
                        </span>

                        <span class="product-link">
                            View →
                        </span>

                    </div>

                </div>
            `;

            productGrid.appendChild(card);
        }
    });
}

filterButtons.forEach(function(button)
{
    button.addEventListener(
        "click",
        function()
        {
            filterButtons.forEach(function(btn)
            {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            displayProducts(
                button.dataset.filter
            );
        }
    );
});


displayProducts("all");
