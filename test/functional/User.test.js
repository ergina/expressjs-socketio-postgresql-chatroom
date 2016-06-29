"use strict";
process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
var app = require('../../app.js');
var http = require('http');
var expect = chai.expect;
var server = http.createServer(app);
chai.use(chaiHttp);

describe('User functional test', function() {

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

  it('expect to get user by username on /user/:kullaniciAdi', function(done) {
    chai.request(server)
    .get('/user/root')
    .auth('root', '123')
    .end(function(err, res) {
      expect(res).to.have.status(200);
      var body = res.body;
      expect(body).to.be.a('object');
      done();
    });
  });

  it('expect to save a user', function(done) {
    var testUser = {
      kullaniciAdi: 'testUser',
      sifre: '123'    };
      chai.request(server)
      .post('/user')
      .send(testUser)
      .end(function(err, res) {
        expect(res).to.have.status(200);
        done();
      });
    });


  });
