const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.CHAVE_CRIPTO || 'chave-secreta-padrao123'; // deve ter 32 bytes
const IV_LENGTH = 16;

// Criptografar chave privada
function criptografarChavePrivada(chavePrivada) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(chavePrivada, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return iv.toString('base64') + ':' + encrypted;
}

// Descriptografar chave privada
function descriptografarChavePrivada(textoCriptografado) {
  const [ivBase64, encryptedData] = textoCriptografado.split(':');
  const iv = Buffer.from(ivBase64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Exportar as funções
module.exports = {
  criptografarChavePrivada,
  descriptografarChavePrivada
};
