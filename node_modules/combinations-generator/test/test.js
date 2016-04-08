var combinations = require('../');
var should = require('should');

var collect = function (comb) {
  var items = [];
  for (var item of comb) {
    items.push(item);
  }
  return items;
}

describe('combinations', function () {
  it('should be a function and return iterator', function() {
    combinations.should.be.a.Function;
    combinations().should.be.an.Object.and.have.property('next').and.be.a.Function;
    combinations().next().should.be.an.Object.and.have.property('done');
  });

  it('should be iterable ', function() {
    var comb = combinations(['a', 'b'], 2);
    for (var item of comb) {
      item.should.be.Array.and.eql(['a', 'b']);
    }
  });

  it('should return combinations', function() {
    var comb = combinations(['a', 'b', 'c'], 2);
    collect(comb).should.be.eql([['a', 'b'], ['a', 'c'], ['b', 'c']]);
    collect(combinations(new Array(7), 5)).should.have.length(21);
  });

  it('should not return wrong combinations', function() {
    combinations(['a'], 0).next().should.be.eql({done: true, value: undefined});
    combinations(['a'], 2).next().should.be.eql({done: true, value: undefined});
    combinations(['a'], -1).next().should.be.eql({done: true, value: undefined});
    combinations([], 1).next().should.be.eql({done: true, value: undefined});
    combinations([], 0).next().should.be.eql({done: true, value: undefined});
  });
});
