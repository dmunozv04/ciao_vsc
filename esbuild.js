const { build } = require('esbuild');

// Common configuration for all builds
const commonConfig = {
  bundle: true,
  platform: 'node',
  format: 'cjs',
  external: ['vscode'],
  minify: true,
};

// Build targets
const buildTargets = [
  {
    entryPoints: ['./client/src/extension.ts'],
    outfile: './out/client/src/extension.js',
  },
  {
    entryPoints: ['./server/src/server.ts'],
    outfile: './out/server/src/server.js',
  },
  {
    entryPoints: ['./shared/types.ts'],
    outfile: './out/shared/types.js',
  },
  {
    entryPoints: ['./shared/ciaoParse.ts'],
    outfile: './out/shared/ciaoParse.js',
  },
];

(async () => {
  try {
    await Promise.all(
      buildTargets.map((target) => build({ ...commonConfig, ...target }))
    );
    console.log('Bundling completed successfully!');
  } catch (error) {
    console.error('Error during bundling:', error);
    process.exit(1);
  }
})();
