const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc'; // padrão seguro

// Cria uma chave de 32 bytes a partir da senha usando scrypt
const gerarChave = (senha) => {
  return crypto.scryptSync(senha, 'salt', 32);
};

function criptografarChavePrivada(chavePrivada, senha) {
  const iv = crypto.randomBytes(16); // vetor de inicialização único para cada criptografia
  const chave = gerarChave(senha);
  const cipher = crypto.createCipheriv(ALGORITHM, chave, iv);

  let encrypted = cipher.update(chavePrivada, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Retorna iv + texto criptografado para descriptografar depois
  return iv.toString('hex') + ':' + encrypted;
}

function descriptografarChavePrivada(chaveCriptografada, senha) {
  const [ivHex, encrypted] = chaveCriptografada.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const chave = gerarChave(senha);
  const decipher = crypto.createDecipheriv(ALGORITHM, chave, iv);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

module.exports = {
  criptografarChavePrivada,
  descriptografarChavePrivada
};
