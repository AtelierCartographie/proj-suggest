import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
	js.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		ignores: [
			'.svelte-kit/',
			'dist/',
			'build/',
			'node_modules/',
			'package/',
			'*.lock',
			'.env',
			'.env.*',
			'!.env.example'
		]
	}
];
