"use strict";
process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
var app = require('../../app.js');
var http = require('http');
var expect = chai.expect;
var server = http.createServer(app);
chai.use(chaiHttp);

describe('Mesaj functional test', function() {

  before(function(done) {
    server.listen(2313, function() {
      done();
    });
  });

  after(function(done) {
    server.close(function() {
      done();
    });
  });

  it('expect to get messsage archive /mesaj/arsiv/:skip/:limit', function(done) {
    chai.request(server)
    .get('/mesaj/arsiv/0/8')
    .auth('root', '123')
    .end(function(err, res) {
      expect(res).to.have.status(200);
      var body = res.body;
      expect(body).to.be.a('object');
      done();
    });
  });

  it('expect to save a messsage', function(done) {
    chai.request(server)
    .get('/user/root')
    .auth('root', '123')
    .end(function(err, res) {
      expect(res).to.have.status(200);
      var body = res.body;
      expect(body).to.be.a('object');
      var testMessage = {
        gonderen_id: body.id,
        mesaj: 'selam'
      };
      chai.request(server)
      .post('/mesaj')
      .auth('root', '123')
      .send(testMessage)
      .end(function(err, res) {
        expect(res).to.have.status(200);
        var body = res.body;
        expect(body).to.be.a('object');
        done();
      });
    });

  });
});
