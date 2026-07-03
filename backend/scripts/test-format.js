const formatearFechas = (obj) => {
  const res = { ...obj, periodo: obj.periodo.split('T')[0] };
  Object.keys(res).forEach(k => {
     if (k.endsWith('ActEn') && res[k]) {
        res[k] = res[k].split('T')[0];
     }
  });
  return res;
};

const obj = {
  periodo: "2026-07-02T00:00:00.000Z",
  obrasActEn: "2026-07-03T01:10:32.312Z"
};
console.log(formatearFechas(obj));
