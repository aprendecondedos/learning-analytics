module.exports = {
  db: {
    uri: 'mongodb://localhost/rest-dev',
    options: {
      user: '',
      pass: ''
    }
  },
  keymetrics: {
    name: 'API Rest Server',
    publicKey: 'XXXXXX',
    privateKey: 'XXXXX',
    instances: 1,
    maxMemory: 512
  }
};
