import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
});

const eslintConfig = [
	...compat.extends("next/core-web-vitals", "next/typescript"),
	{
		ignores: [
			"node_modules/**",
			".next/**",
			"out/**",
			"build/**",
			"next-env.d.ts",
			"backend/**",
		],
		rules: {
			"@typescript-eslint/ban-ts-comment": "off",
			"@typescript-eslint/no-unused-vars": "off",
			"@typescript-eslint/explicit-function-return-type": "off",
			"@typescript-eslint/prefer-const": "off",
			"no-console": "off",
			"no-debugger": "off",
			"no-var": "off",
			"@typescript-eslint/no-empty-object-type": "off",
			"@typescript-eslint/no-implicit-any": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-inferrable-types": "off",
			"@typescript-eslint/explicit-module-boundary-types": "off",
		},
	},
];

export default eslintConfig;
