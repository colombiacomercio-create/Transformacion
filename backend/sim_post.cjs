const axios = require('axios');
async function run() {
  try {
    const res = await axios.post('http://localhost:4000/api/ficha-resultados', {
      id: "d2355795-848e-4887-8a84-aa5f5aef221e",
      periodo: "2026-08-27",
      obrasProgramadasAlCorte: 10,
      seccionesActualizadas: ["obras"]
    });
    console.log("Success:", res.data.obrasProgramadasAlCorte);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}
run();
