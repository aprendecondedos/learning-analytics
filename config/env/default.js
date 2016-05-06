module.exports = {
  app: {
    title: 'Learning Analytics',
    description: 'Learning analytics for Dedos Web'
  },
  port: process.env.PORT || 8888,
  host: process.env.HOST || '0.0.0.0',
  db: {
    uri: process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || 'mongodb://' + (process.env.DB_1_PORT_27017_TCP_ADDR || 'localhost') + '/learning-analytics',
    options: {
      user: '',
      pass: ''
    },

    // Enable mongoose debug mode
    debug: process.env.MONGODB_DEBUG || false
  }
};
