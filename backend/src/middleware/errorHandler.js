exports.notFound = (req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan' });
// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Body bukan JSON yang valid' });
  console.error(err);
  res.status(500).json({ error: 'Terjadi kesalahan pada server' });
};
