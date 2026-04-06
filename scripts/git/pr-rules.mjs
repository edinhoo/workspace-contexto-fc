const REQUIRED_HEADERS = [
  "## Contexto",
  "## O que foi feito",
  "## Impacto",
  "## Validacao",
  "## Observacoes",
];

const normalizeLines = (body) => body.replace(/\r\n/g, "\n").split("\n");

const hasContentAfter = (lines, startIndex) => {
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (!line) {
      continue;
    }

    if (REQUIRED_HEADERS.includes(line)) {
      return false;
    }

    if (line.startsWith("- ")) {
      return true;
    }
  }

  return false;
};

const hasCheckboxAfter = (lines, startIndex) => {
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (!line) {
      continue;
    }

    if (REQUIRED_HEADERS.includes(line)) {
      return false;
    }

    if (/^- \[( |x)\] /.test(line)) {
      return true;
    }
  }

  return false;
};

export const validatePrBody = (body) => {
  const lines = normalizeLines(body);
  const errors = [];

  for (const header of REQUIRED_HEADERS) {
    const headerIndex = lines.findIndex((line) => line.trim() === header);

    if (headerIndex === -1) {
      errors.push(`Secao obrigatoria ausente: ${header}`);
      continue;
    }

    if (!hasContentAfter(lines, headerIndex)) {
      errors.push(`A secao ${header} precisa ter pelo menos um item com '- '.`);
    }
  }

  const impactIndex = lines.findIndex((line) => line.trim() === "## Impacto");
  const validationIndex = lines.findIndex((line) => line.trim() === "## Validacao");

  if (impactIndex !== -1 && !hasCheckboxAfter(lines, impactIndex)) {
    errors.push("A secao ## Impacto precisa usar checkboxes.");
  }

  if (validationIndex !== -1 && !hasCheckboxAfter(lines, validationIndex)) {
    errors.push("A secao ## Validacao precisa usar checkboxes.");
  }

  return errors;
};
