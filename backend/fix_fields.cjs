const axios = require('axios');
async function run() {
  try {
    const res = await axios.post('http://localhost:4000/api/ficha-resultados', {
      id: "d2355795-848e-4887-8a84-aa5f5aef221e",
      periodo: "2026-08-27",
      metaCompromisosPct: 0,
      metaGirosPct: 0,
      obrasProgramadasAlCorte: 0,
      rollosProgramadosAlCorte: 0,
      puntosSostenidosProgramados: 0,
      personasSensibilizadasProgramadas: 0,
      operativosIVCProgramados: 0,
      puntosProgramadosSostenibilidad: 0,
      archivosProgramadosCorte: 0,
      fallosProgramadosCorte: 0,
      motosProgramadasCorte: 0,
      estrategiasProgramadasCorte: 0
    });
    console.log("Success");
  } catch (err) {}
}
run();
