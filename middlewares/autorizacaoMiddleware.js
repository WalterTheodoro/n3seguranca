module.exports = function autorizar(...cargosPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
    }

    if (!cargosPermitidos.includes(req.usuario.cargo)) {
      return res.status(403).json({ mensagem: 'Acesso negado. Permissão insuficiente.' });
    }

    next();
  };
};