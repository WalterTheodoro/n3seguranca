const mongoose = require('mongoose');

const relatorioSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descricao: { type: String, required: true },
  valor: { type: Number, required: true },
  data: { type: Date, default: Date.now },
  status: { type: String, enum: ['pendente', 'validado', 'assinado'], default: 'pendente' },
  criadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assinaturaDigital: { type: String, default: null }, // futuramente
}, { timestamps: true });

module.exports = mongoose.model('Relatorio', relatorioSchema);
