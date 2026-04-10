const LOW_DATA_DEFAULTS = {
  maxLimit: 5,
  defaultFields: null,
};

const lowDataMiddleware = (options = {}) => {
  const config = { ...LOW_DATA_DEFAULTS, ...options };

  return (req, _res, next) => {
    const isLowData = req.headers['x-low-data'] === '1';
    req.isLowData = isLowData;

    if (isLowData) {
      if (req.query.limit) {
        const requested = parseInt(req.query.limit, 10);
        if (requested > config.maxLimit) {
          req.query.limit = String(config.maxLimit);
        }
      } else {
        req.query.limit = String(config.maxLimit);
      }

      if (config.defaultFields && !req.query.fields) {
        req.query.fields = config.defaultFields;
      }
    }

    next();
  };
};

export default lowDataMiddleware;
