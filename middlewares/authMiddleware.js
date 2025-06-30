const jwt = require('jsonwebtoken');
const User = require('../models/User');

const proteger = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Verifica se o token foi enviado no header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ mensagem: 'Token não fornecido.' });
    }

    const token = authHeader.split(' ')[1];

    // Verifica e decodifica o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Busca o usuário pelo ID do token
    const usuario = await User.findById(decoded.id).select('-senhaHash');

    if (!usuario) {
      return res.status(401).json({ mensagem: 'Usuário não encontrado.' });
    }

    req.usuario = usuario; // anexa o usuário autenticado ao request
    next();
  } catch (error) {
    res.status(401).json({ mensagem: 'Token inválido ou expirado.', erro: error.message });
  }
};

module.exports = proteger;
