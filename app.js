var products = [
    {
        name: "Money RPG",
        category: "software",
        description:
            "Turn saving money into an RPG-style progression system.",
        price: "Free",
        image: "assets/products/money-rpg.jpg",
        url: "#"
    },

    {
        name: "Zombie Town",
        category: "game",
        description:
            "A small survival game set in an abandoned town.",
        price: "$4.99",
        image: "assets/products/zombie-town.jpg",
        url: "#"
    },

    {
        name: "CSV Analyzer",
        category: "tool",
        description:
            "Quickly explore and visualize CSV datasets.",
        price: "$2.99",
        image: "assets/products/csv-analyzer.jpg",
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

            card.className =
                "product-card";

            card.innerHTML = `
                <div class="product-image">
                    ${
                        product.image
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

                        <a
                            href="${product.url}"
                            class="product-link"
                        >
                            View →
                        </a>

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