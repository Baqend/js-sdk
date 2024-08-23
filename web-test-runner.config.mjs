export default {
  concurrency: 10,
  nodeResolve: true,
  watch: true,
  files: 'spec/**/*.spec.js',
  // manual: true,
  // http2: true,
  testFramework: {
    config: {
      timeout: 30000,
    },
  },
  testRunnerHtml: testFramework =>
    `<html>
      <body>
        <script defer src="./node_modules/validator/validator.js"></script>
        <script defer src="./node_modules/otpauth/dist/otpauth.umd.js"></script>
        <script defer src="./node_modules/chai/chai.js"></script>
        <script type="module">
            import * as Baqend from './dist/baqend.es2015.js'
            window.Baqend = Baqend;
            
            window.expect = chai.expect;
        </script>
        <script defer src="./spec/env.js"></script>
        <script defer src="./spec/helper.js"></script>
        <script type="module" src="${testFramework}"></script>
      </body>
    </html>`
};
