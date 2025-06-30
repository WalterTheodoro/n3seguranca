const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Define o schema
const userSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  senhaHash: {
    type: String,
    required: true,
  },
  cargo: {
    type: String,
    enum: ['funcionario', 'gerente', 'diretor'],
    required: true,
  },
  chavePublica: {
    type: String, // Base64 da chave pública
  },
  chavePrivadaCriptografada: {
    type: String, // opcional, armazenada de forma segura
  },
}, {
  timestamps: true // Cria automaticamente createdAt e updatedAt
});

// Antes de salvar, criptografa a senha se foi modificada
userSchema.pre('save', async function (next) {
  if (!this.isModified('senhaHash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.senhaHash = await bcrypt.hash(this.senhaHash, salt);
  next();
});

// Método para comparar senha na autenticação
userSchema.methods.validarSenha = async function (senhaDigitada) {
  return await bcrypt.compare(senhaDigitada, this.senhaHash);
};

module.exports = mongoose.model('User', userSchema);
