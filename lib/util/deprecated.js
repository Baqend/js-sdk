module.exports = (obj, signature, alternative) => {
  Object.defineProperty(obj, signature, {
    get() {
      console.log('Usage of ' + obj.constructor.name + '.' + signature + ' is deprecated.');
      return obj[alternative];
    },
    enumerable: true
  });
};