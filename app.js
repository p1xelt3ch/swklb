var products = [
    {
        name: "Zombie Game",
        category: "game",
        description:
            "A simple zombie survival shooter. Survive as long as you can.",
        //price: "FREE",
        image: "img/Zombie Game_ Ruined Horizon.png",
        url: "zombiegame.html"
    },

    {
        name: "CueFluence",
        category: "tool",
        description:
            "Analyze forex markets and get simple BUY or WAIT signals based on key technical indicators.",
        price: "$9.99/month",
        image: "img/cuefluence.png",
        url: "cuefluence.html"
    },

    {
        name: "Zombie Game 2D",
        category: "game",
        description:
            "The initial 2D proto build of Zombie Game. A simple zombie survival shooter. Survive as long as you can.",
        price: "FREE",
        image: "img/zombiegame2d.png",
        url: "https://swooklabs.com/sz2/"
    },
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
    document.createElement("a");

card.className = "product-card";

card.href = product.url;

card.setAttribute(
    "aria-label",
    "View " + product.name
);

card.style.textDecoration = "none";
card.style.color = "inherit";

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
                            ${product.price || ""}
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
