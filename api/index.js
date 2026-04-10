// Root-level Vercel serverless entrypoint.
// The buildCommand compiles server TypeScript to server/dist/ before this file
// is bundled, so the require() below resolves to the already-compiled output.
// ncc (used by @vercel/node) follows the require chain into server/dist/ and
// picks up all dependencies from server/node_modules/ automatically.
module.exports = require('../server/dist/api/index').default;
