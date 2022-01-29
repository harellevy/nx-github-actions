import { getCacheKeys, NX_CACHE_PATH, restoreNxCache, saveNxCache } from './cache';
import { context } from '@actions/github';
import { saveCache, restoreCache, ReserveCacheError } from '@actions/cache';
import { resolve } from 'path';

describe('cache', () => {
  process.env.RUNNER_OS = process.env.RUNNER_OS || process.platform;
  process.env.RUNNER_ARCH = process.env.RUNNER_ARCH || process.arch;

  beforeEach(() => {
    (restoreCache as jest.Mock).mockClear();
    (saveCache as jest.Mock).mockClear();
  });

  describe('getCacheKeys', () => {
    it('should create primary key composed of platform, arch, date, target, distribution and pr', async () => {
      const [primary] = await getCacheKeys('test', 5);
      const now = new Date();
      expect(primary).toContain(`${process.env.RUNNER_OS}-`);
      expect(primary).toContain(`-${process.env.RUNNER_ARCH}-`);
      expect(primary).toContain(`-${now.getFullYear()}-${now.getMonth() + 1}-`);
      expect(primary).toContain(`-test-`);
      expect(primary).toContain(`-5-`);
      expect(primary).toContain(`-${context.payload.pull_request.number.toString()}`);
    });

    it('should create restore keys variations without pr, distribution and target', async () => {
      const [_, [withoutPR, withoutBucket, withoutTarget]] = await getCacheKeys('test', 5);
      // withoutPR
      expect(withoutPR).not.toContain(`-${context.payload.pull_request.number.toString()}`);
      expect(withoutPR).toContain(`-5`);
      // withoutBucket
      expect(withoutBucket).not.toContain(`-${context.payload.pull_request.number.toString()}`);
      expect(withoutBucket).not.toContain(`-5-`);
      expect(withoutPR).toContain(`-test`);
      // withoutTarget
      expect(withoutTarget).not.toContain(`-${context.payload.pull_request.number.toString()}`);
      expect(withoutTarget).not.toContain(`-5-`);
      expect(withoutTarget).not.toContain(`-test-`);
    });
  });

  describe('restoreNxCache', () => {
    it('should restore cache with primary key and restoreKeys', async () => {
      await restoreNxCache('test', ['test2']);
      expect(restoreCache).toHaveBeenCalledWith([NX_CACHE_PATH], 'test', ['test2']);
    });

    it('should fail silently', async () => {
      (restoreCache as jest.Mock).mockRejectedValue('');
      await expect(restoreNxCache('test', ['test2'])).resolves.toBeUndefined();
    });
  });

  describe('saveNxCache', () => {
    it('should save cache with primary key', async () => {
      await saveNxCache('test');
      expect(saveCache).toHaveBeenCalledWith([resolve(NX_CACHE_PATH)], 'test');
    });

    it('should fail silently for ReserveCacheError', async () => {
      (saveCache as jest.Mock).mockRejectedValueOnce(new ReserveCacheError('test'));
      await expect(saveNxCache('test')).resolves.toBeUndefined();
    });

    it('should fail for not ReserveCacheError', async () => {
      (saveCache as jest.Mock).mockRejectedValueOnce(new Error('test'));
      await expect(saveNxCache('test')).rejects.toThrowError('test');
    });
  });
});
