async function testLive() {
  const data = {
    periodo: "2026-06-25",
    metaObras: 20
  };
  const res = await fetch('https://transformacion-backend.vercel.app/api/ficha-resultados', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}
testLive();
