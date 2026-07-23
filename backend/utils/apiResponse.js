// Trả response thành công theo cấu trúc thống nhất của API.
const sendSuccess = (res, data = null, message = 'OK', statusCode = 200, meta = undefined) => {
  const body = {
    success: true,
    message,
    data,
  };

  if (meta) {
    body.meta = meta;
  }

  return res.status(statusCode).json(body);
};

module.exports = {
  sendSuccess,
};
