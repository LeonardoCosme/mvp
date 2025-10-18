import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Importa as configurações básicas do Next.js + TypeScript
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],

    rules: {
      // ⚙️ Desativa o erro de uso de "any"
      "@typescript-eslint/no-explicit-any": "off",

      // ⚙️ Mantém outras regras úteis do Next.js
      "react/react-in-jsx-scope": "off",
      "react/no-unescaped-entities": "off",

      // ⚙️ Opcional: ignora aviso sobre <img>
      "@next/next/no-img-element": "off",
    },
  },
];

export default eslintConfig;
