interface Array<T> {
  swap(x: number, y: number): Array<T>;
}

Array.prototype.swap = function (x, y) {
  const temp = this[x];
  this[x] = this[y];
  this[y] = temp;
  return this;
};
