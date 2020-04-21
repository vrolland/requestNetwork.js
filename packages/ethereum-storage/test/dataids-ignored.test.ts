import 'mocha';

import DataIdsIgnored from '../src/dataIds-ignored';

import { expect } from 'chai';
import * as sinon from 'sinon';

const hash = 'QmNXA5DyFZkdf4XkUT81nmJSo3nS2bL25x7YepxeoDa6tY';
const reason = 'this is a little test !';
const hash2 = 'hash2';
const reason2 = 'this is a second test !';

let dataIdsIgnored: DataIdsIgnored;

// tslint:disable:no-magic-numbers
describe('DataIds ignored', () => {
  beforeEach(() => {
    dataIdsIgnored = new DataIdsIgnored();
  });

  describe('save', () => {
    it('can save()', async () => {
      await dataIdsIgnored.save(hash, reason, true);

      expect(await dataIdsIgnored.getReason(hash)).to.be.equal(reason);
    });
    describe('getDataIdsWithReasons', () => {
      it('can getDataIdsWithReasons()', async () => {
        sinon.useFakeTimers();

        await dataIdsIgnored.save(hash, reason, true);
        await dataIdsIgnored.save(hash2, reason2, false);

        expect(await dataIdsIgnored.getDataIdsWithReasons()).to.be.deep.equal({
          [hash]: {
            iteration: 1,
            reason,
            timeoutLastTry: 0,
            toRetry: true,
          },
          [hash2]: {
            iteration: 1,
            reason: reason2,
            timeoutLastTry: 0,
            toRetry: false,
          },
        });
        sinon.restore();
      });
      it('can getDataIdsWithReasons() if empty', async () => {
        expect(await dataIdsIgnored.getDataIdsWithReasons()).to.be.deep.equal({});
      });
    });
    describe('getDataIds', () => {
      it('can getDataIds()', async () => {
        await dataIdsIgnored.save(hash, reason, true);
        await dataIdsIgnored.save(hash2, reason2, true);

        expect(await dataIdsIgnored.getDataIds()).to.be.deep.equal([hash, hash2]);
      });
      it('can getDataIds() if empty', async () => {
        expect(await dataIdsIgnored.getDataIds()).to.be.deep.equal([]);
      });
    });
  });
});
