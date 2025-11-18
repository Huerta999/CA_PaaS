const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, "Datos", "datos.txt");

const dataDir = path.join(__dirname, "Datos");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(DATA_PATH)) {
  const datosIniciales = `001 Juan 5000.00 JUAP900101HDFRRN01
002 Maria 3500.50 MARG850505MDFRZN02
003 Pedro 10000.00 PEDL920315HDFRRD03`;
  fs.writeFileSync(DATA_PATH, datosIniciales, "utf8");
}

function leerCuentas() {
  const data = fs.readFileSync(DATA_PATH, "utf8").trim().split("\n");
  return data.map(linea => {
    const [cuenta, nombre, saldo, curp] = linea.split(" ");
    return { cuenta, nombre, saldo: parseFloat(saldo), curp };
  });
}

function guardarCuentas(cuentas) {
  const contenido = cuentas.map(
    c => `${c.cuenta} ${c.nombre} ${c.saldo} ${c.curp}`
  ).join("\n");
  fs.writeFileSync(DATA_PATH, contenido, "utf8");
}

app.get("/", (req, res) => {
  res.send("💳 Bienvenido al Cajero Automático REST - Desplegado en Railway");
});

app.get("/cuentas", (req, res) => {
  try {
    res.json(leerCuentas());
  } catch (error) {
    res.status(500).send("Error al leer cuentas");
  }
});

app.get("/cuenta/:id", (req, res) => {
  try {
    const cuentas = leerCuentas();
    const cuenta = cuentas.find(c => c.cuenta === req.params.id);
    if (cuenta) res.json(cuenta);
    else res.status(404).send("❌ Cuenta no encontrada.");
  } catch (error) {
    res.status(500).send("Error al buscar cuenta");
  }
});

app.put("/depositar/:id/:monto", (req, res) => {
  try {
    const cuentas = leerCuentas();
    const cuenta = cuentas.find(c => c.cuenta === req.params.id);
    if (!cuenta) return res.status(404).send("Cuenta no encontrada.");
    cuenta.saldo += parseFloat(req.params.monto);
    guardarCuentas(cuentas);
    res.send(`💰 Depósito exitoso. Nuevo saldo: $${cuenta.saldo}`);
  } catch (error) {
    res.status(500).send("Error al depositar");
  }
});

app.put("/retirar/:id/:monto", (req, res) => {
  try {
    const cuentas = leerCuentas();
    const cuenta = cuentas.find(c => c.cuenta === req.params.id);
    if (!cuenta) return res.status(404).send("Cuenta no encontrada.");
    const monto = parseFloat(req.params.monto);
    if (cuenta.saldo < monto) return res.send("❌ Saldo insuficiente.");
    cuenta.saldo -= monto;
    guardarCuentas(cuentas);
    res.send(`✅ Retiro exitoso. Nuevo saldo: $${cuenta.saldo}`);
  } catch (error) {
    res.status(500).send("Error al retirar");
  }
});

app.put("/transferir/:origen/:destino/:monto", (req, res) => {
  try {
    const cuentas = leerCuentas();
    const origen = cuentas.find(c => c.cuenta === req.params.origen);
    const destino = cuentas.find(c => c.cuenta === req.params.destino);
    const monto = parseFloat(req.params.monto);

    if (!origen || !destino) return res.status(404).send("Cuenta(s) no encontrada(s).");
    if (origen.saldo < monto) return res.send("❌ Saldo insuficiente.");

    origen.saldo -= monto;
    destino.saldo += monto;
    guardarCuentas(cuentas);
    res.send(`💸 Transferencia exitosa de $${monto} de ${origen.nombre} a ${destino.nombre}.`);
  } catch (error) {
    res.status(500).send("Error al transferir");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor REST corriendo en puerto ${PORT}`);
});
