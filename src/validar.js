function enteroPositivo(valor) {
  if (typeof valor === 'number' && Number.isInteger(valor) && valor > 0) {
    return valor;
  }
  if (typeof valor === 'string' && /^[1-9]\d*$/.test(valor.trim())) {
    return Number(valor.trim());
  }
  return null;
}

function enteroNoNegativo(valor) {
  if (typeof valor === 'number' && Number.isInteger(valor) && valor >= 0) {
    return valor;
  }
  if (typeof valor === 'string' && /^(?:0|[1-9]\d*)$/.test(valor.trim())) {
    return Number(valor.trim());
  }
  return null;
}

function normalizarImporte(valor) {
  let texto;

  if (typeof valor === 'number') {
    if (!Number.isFinite(valor) || valor <= 0) {
      return null;
    }
    texto = valor.toFixed(2);
    if (Math.abs(valor - Number(texto)) > 1e-6) {
      return null;
    }
  } else if (typeof valor === 'string') {
    const limpio = valor.trim();
    if (!/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/.test(limpio)) {
      return null;
    }
    const [entero, decimal = ''] = limpio.split('.');
    texto = `${entero}.${decimal.padEnd(2, '0')}`;
    if (Number(texto) <= 0) {
      return null;
    }
  } else {
    return null;
  }

  const [entero] = texto.split('.');
  if (entero.length > 8) {
    return null;
  }
  return texto;
}

function textoObligatorio(valor, maximo) {
  if (typeof valor !== 'string') {
    return null;
  }
  const limpio = valor.trim();
  if (limpio.length === 0 || limpio.length > maximo) {
    return null;
  }
  return limpio;
}

function normalizarCorreo(valor) {
  const correo = textoObligatorio(valor, 120);
  if (correo === null) {
    return null;
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
    return null;
  }
  return correo.toLowerCase();
}

function normalizarDocumento(valor) {
  if (typeof valor !== 'string' && typeof valor !== 'number') {
    return null;
  }
  const documento = String(valor).trim();
  if (!/^[0-9]{8,12}$/.test(documento)) {
    return null;
  }
  return documento;
}

function responderError(err, res) {
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Ya existe un registro con ese valor único.' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ error: 'La referencia indicada no existe.' });
  }
  if (err.code === '23514') {
    return res.status(400).json({ error: 'Los datos no cumplen las restricciones definidas en la base de datos.' });
  }
  if (err.code === '22003' || err.code === '22P02') {
    return res.status(400).json({ error: 'Hay un valor con tipo o rango inválido.' });
  }
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === '28P01' || err.code === '3D000') {
    return res.status(503).json({
      error: 'No se pudo conectar con PostgreSQL. Revise el archivo .env y que el servicio esté en ejecución.'
    });
  }
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor.' });
}

module.exports = {
  enteroPositivo,
  enteroNoNegativo,
  normalizarImporte,
  textoObligatorio,
  normalizarCorreo,
  normalizarDocumento,
  responderError
};
