// Variables globales
const cart = [];
const cartBadge = document.getElementById("cartBadge");
const cartItemsContainer = document.getElementById("cartItemsContainer");
const cartTotal = document.getElementById("cartTotal");
const darkModeToggle = document.getElementById("darkModeToggle");
const body = document.body;

// Referencias adicionales
const navbar = document.getElementById("navbar");
const footer = document.getElementById("footer");

// Actualizar carrito
function updateCart() {
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);

  // Actualizar badge y total
  cartBadge.textContent = cart.length;
  cartTotal.textContent = `$${subtotal.toFixed(2)}`;

  // Actualizar contenido del carrito
  cartItemsContainer.innerHTML = cart.length
    ? cart
        .map((item) => {
          return `<div class="d-flex justify-content-between align-items-center mb-2">
                  <span>${item.name}</span>
                  <span>$${item.price.toFixed(2)}</span>
                </div>`;
        })
        .join("")
    : '<div class="text-muted">Your cart is empty</div>';
}

// Añadir al carrito
function addToCart(product) {
  cart.push(product);
  updateCart();
}

// Asignar eventos a botones "Add to Cart"
document.querySelectorAll(".btn-outline-primary").forEach((btn) => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".card");
    const id = card.getAttribute("data-id");
    const name = card.querySelector(".card-title").textContent;
    const description = card.getAttribute("data-description");
    const image = card.querySelector(".card-img-top").src;
    const price = parseFloat(card.querySelector(".h5").textContent.slice(1));

    addToCart({ id, name, description, image, price });
  });
});

// Enviar carrito al servidor (Mercado Pago)
document.querySelector(".btn-success").addEventListener("click", async () => {
  const items = cart.map((item) => ({
    id: item.id,
    title: item.name,
    description: item.description,
    picture_url: item.image,
    quantity: 1,
    currency_id: "ARS", // Cantidad fija
    unit_price: item.price,
  }));

  try {
    const response = await fetch("/create-preference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    // Validar la respuesta del servidor
    if (!response.ok) {
      console.error("Error al crear la preferencia:", await response.text());
      return; // Salir de la función si hay un error
    }

    const { init_point } = await response.json();

    if (init_point) {
      window.location.href = init_point; // Redirige a Mercado Pago
    } else {
      console.error("Error: No se recibió un punto de inicialización válido");
    }
  } catch (error) {
    console.error("Error:", error);
  }
});

// Toggle modo oscuro
darkModeToggle.addEventListener("click", () => {
  body.classList.toggle("bg-dark");
  body.classList.toggle("text-white");

  // Cambiar clases del navbar
  navbar.classList.toggle("navbar-dark");
  navbar.classList.toggle("bg-custom-dark");
  navbar.classList.toggle("navbar-light");
  navbar.classList.toggle("bg-light");

  darkModeToggle.classList.toggle("btn-outline-dark");
  darkModeToggle.classList.toggle("btn-outline-light");

  const icon = darkModeToggle.querySelector(".bi");
  icon.classList.toggle("bi-moon-stars"); // Icono para modo claro
  icon.classList.toggle("bi-sun"); // Icono para modo oscuro

  // Cambiar clases del footer
  footer.classList.remove("bg-light"); // Eliminar la clase predeterminada
  footer.classList.toggle("bg-custom-dark"); // Añadir clase personalizada
  footer.classList.toggle("text-white"); // Cambiar el color del texto
});
