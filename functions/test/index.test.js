const sinon = require('sinon');
const chai = require('chai');
const assert = chai.assert;
const admin = require('firebase-admin');
const test = require('firebase-functions-test')();

describe('Cloud Functions', () => {
  let myFunctions, adminInitStub, adminDatabaseStub;

  before(() => {
    adminInitStub = sinon.stub(admin, 'initializeApp');
    adminDatabaseStub = sinon.stub(admin, 'database');
    myFunctions = require('../index');
  });

  after(() => {
    adminInitStub.restore();
    adminDatabaseStub.restore();
    test.cleanup();
  });

  describe('account', () => {
    it('should write to /users', () => {
      // given
      const uid = 1234;
      const email = 'test@test.com';

      const setParam = { email, uid };
      const setStub = sinon.stub();
      setStub.withArgs(setParam).returns(true);

      const refStub = sinon.stub();
      refStub.withArgs('/users/' + uid).returns({ set: setStub });

      adminDatabaseStub.get(() => {
        return () => {
          return { ref: refStub };
        };
      });

      const wrapped = test.wrap(myFunctions.account);

      const event = {
        uid,
        providerData: [
          {
            email
          }
        ]
      };

      // when
      const actual = wrapped(event);
      const expected = true;

      // then
      return assert.equal(actual, expected);
    });
  });
});
