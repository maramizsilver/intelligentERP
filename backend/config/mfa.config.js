
module.exports = {
  totp: {
    issuer: 'ERP',
    window: 1,
    length: 20,
    step: 30
  },
  backup: {
    count: 10,
    length: 8
  },
  security: {
    maxAttempts: 5,
    lockDuration: 15,
    tempTokenExpiry: 5
  },
  qr: {
    width: 300,
    margin: 2
  },
  banner: {
    enabled: true,
    daysToShow: 7,      
    dismissible: true
  }
};