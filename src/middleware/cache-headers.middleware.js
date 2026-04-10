const cacheHeaders = (maxAge = 300) => {
  return (_req, res, next) => {
    res.set({
      'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
      Vary: 'Accept, X-Low-Data',
    });
    next();
  };
};

export default cacheHeaders;
