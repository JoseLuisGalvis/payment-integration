require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const { MercadoPagoConfig, Preference } = require("mercadopago");

const app = express();

// Middleware de seguridad
app.use(helmet());

// Middleware
app.use(bodyParser.json());

// Servir archivos estáticos desde 'views' y 'public'
app.use(express.static(path.join(__dirname, "views")));
app.use(express.static(path.join(__dirname, "public")));

// Ruta raíz
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Rutas para las vistas de Mercado Pago (success, failure, pending)
app.get("/success", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "success.html"));
});

app.get("/failure", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "failure.html"));
});

app.get("/pending", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "pending.html"));
});

// Configuración de Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.ACCESS_TOKEN,
});

// Ruta de preferencia de pago
app.post("/create-preference", async (req, res) => {
  try {
    const { items } = req.body;

    // Validación básica de entrada
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Datos de items inválidos" });
    }

    const preference = new Preference(client);
    const response = await preference.create({
      headers: {
        "x-integrator-id": process.env.INTEGRATOR_ID,
      },
      body: {
        items: items.map((item) => ({
          title: item.name,
          unit_price: item.price,
          quantity: 1,
        })),
        payment_methods: {
          excluded_payment_types: [], // incluir todos los tipos de pago (crédito, débito, etc.)
          excluded_payment_methods: [
            { id: "visa" }, // Excluir específicamente Visa
          ],
          installments: 6, // Número máximo de cuotas permitido
        },
        back_urls: {
          success: "http://localhost:3000/success",
          failure: "http://localhost:3000/failure",
          pending: "http://localhost:3000/pending",
        },
        auto_return: "approved",
        external_reference: "jolugales@gmail.com",
        // notification_url: "http://localhost:3000/webhook",
      },
    });

    res.json({ init_point: response.init_point });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//  Manejo Webhooks de Mercado Pago
app.post("/webhook", (req, res) => {
  const { type, data } = req.body;

  switch (type) {
    case "payment":
      console.log("Pago recibido:", data);
      // Procesar la notificación de pago
      break;
    case "merchant_order":
      console.log("Orden de compra:", data);
      // Procesar la orden de compra
      break;
    default:
      console.log("Tipo de notificación no manejado:", type);
  }
  console.log("Webhook recibido:", req.body);
  res.status(200).send("Webhook recibido");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto http://localhost:${PORT}`);
});
