module.exports = {
  extends: 'airbnb-base',
	parser: 'babel-eslint',
  root: true,
  rules: {
    'import/no-unresolved': [2, { caseSensitive: false }],
    'import/prefer-default-export': [0],
		'babel/new-cap': 1,
		'babel/no-invalid-this': 1,
		'babel/object-curly-spacing': 1,
		'babel/quotes': 0,
		'babel/semi': 1,
		'babel/no-unused-expressions': 1,
		'babel/valid-typeof': 1,
    'no-bitwise': 0,
  },
  env: {
    jest: true,
  },
	plugins: [
		'babel',
	]
};
