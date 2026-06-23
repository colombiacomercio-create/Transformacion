const form = { residuosM3: 60 };
const originalForm = { residuosM3: 50 };
const campo = { key: 'residuosM3' };
console.log(form[campo.key] !== originalForm[campo.key]);
