if (typeof module !== 'undefined') {
  require('./node');
}

// Skip this test in browser environment as it requires Node.js modules
if (typeof window !== 'undefined') {
  describe.skip('Test deploy', function () {
    it('skipped in browser environment', function () {});
  });
} else {
  // Node.js environment - use CommonJS requires
  const { glob } = require('glob');
  const path = require('path');
  const fs = require('fs');
  const os = require('os');

  describe('Test deploy', function () {
  this.timeout(10 * 1000);

  let testDir;
  let subDir;

  before(function () {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-test-'));
    subDir = path.join(testDir, 'website-dist');
    fs.mkdirSync(subDir);

    fs.writeFileSync(path.join(subDir, 'index.html'), '<html></html>');
    fs.writeFileSync(path.join(subDir, 'style.css'), 'body {}');
    fs.mkdirSync(path.join(subDir, 'assets'));
    fs.writeFileSync(path.join(subDir, 'assets', 'logo.png'), 'fake-png-data');

    fs.writeFileSync(path.join(testDir, 'package.json'), '{}');
    fs.writeFileSync(path.join(testDir, 'README.md'), '# Test');
  });

  after(function () {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe('glob file matching', function () {
    it('should only match files in the specified cwd directory', async function () {
      const pattern = '**/*';
      const cwd = subDir;

      const files = await glob(pattern, { nodir: true, cwd });

      expect(files).to.have.lengthOf(3);
      expect(files).to.include('index.html');
      expect(files).to.include('style.css');
      expect(files).to.include(path.join('assets', 'logo.png').replace(/\\/g, '/'));

      expect(files).to.not.include('package.json');
      expect(files).to.not.include('README.md');
    });

    it('should match files from process.cwd() when cwd option is missing (BUG)', async function () {
      const pattern = '**/*';

      const filesWithoutCwd = await glob(pattern, { nodir: true });

      expect(filesWithoutCwd.length).to.be.greaterThan(10);

      const hasProjectFiles = filesWithoutCwd.some(
        (f) => f.includes('package.json') || f.includes('README.md') || f.includes('tsconfig'),
      );
      expect(hasProjectFiles).to.be.true;
    });

    it('should include directories when nodir option is missing (BUG)', async function () {
      const pattern = '**/*';
      const cwd = subDir;

      const filesWithDirs = await glob(pattern, { cwd });

      const hasDir = filesWithDirs.some((f) => f === 'assets');
      expect(hasDir).to.be.true;

      const filesWithoutDirs = await glob(pattern, { nodir: true, cwd });
      const hasDirAfterFix = filesWithoutDirs.some((f) => f === 'assets');
      expect(hasDirAfterFix).to.be.false;
    });
  });
});
}
