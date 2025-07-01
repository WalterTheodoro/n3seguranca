const crypto = require('crypto');

const chaveCriptografia = process.env.KEY_CRIPTO || 'segredo-padrao';

function criptografar(texto) {
  const iv = crypto.randomBytes(16);
  const chave = crypto.scryptSync(chaveCriptografia, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', chave, iv);
  let criptografado = cipher.update(texto, 'utf8', 'hex');
  criptografado += cipher.final('hex');
  return iv.toString('hex') + ':' + criptografado;
}

function descriptografar(textoCriptografado) {
  const [ivHex, conteudo] = textoCriptografado.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const chave = crypto.scryptSync(chaveCriptografia, 'salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', chave, iv);
  let descriptografado = decipher.update(conteudo, 'hex', 'utf8');
  descriptografado += decipher.final('utf8');
  return descriptografado;
}

module.exports = {
  criptografar,
  descriptografar
};
