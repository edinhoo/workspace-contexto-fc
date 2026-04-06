const HEADER_PATTERN = /^([a-z]+)\(([a-z0-9-]+)\): (.+)$/;
const REQUIRED_SECTIONS = ["Contexto:", "O que foi feito:", "Impactos:", "Validacao:"];

const normalizeLines = (message) => message.replace(/\r\n/g, "\n").split("\n");

const hasBulletsAfter = (lines, startIndex) => {
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (!line) {
      continue;
    }

    if (REQUIRED_SECTIONS.includes(line)) {
      return false;
    }

    if (line.startsWith("- ")) {
      return true;
    }
  }

  return false;
};

const hasValidationCheckboxes = (lines, startIndex) => {
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (!line) {
      continue;
    }

    if (REQUIRED_SECTIONS.includes(line)) {
      return false;
    }

    if (/^- \[( |x)\] /.test(line)) {
      return true;
    }
  }

  return false;
};

export const isExemptCommitMessage = (message) => {
  const trimmed = message.trim();

  return trimmed.startsWith("Merge ") || trimmed.startsWith("Revert \"");
};

export const validateCommitMessage = (message) => {
  if (isExemptCommitMessage(message)) {
    return [];
  }

  const lines = normalizeLines(message);
  const errors = [];
  const header = lines[0]?.trim() ?? "";

  if (!HEADER_PATTERN.test(header)) {
    errors.push("O titulo deve seguir o formato <tipo>(<escopo>): <resumo curto>.");
  }

  if (lines[1]?.trim() !== "") {
    errors.push("A segunda linha deve ficar em branco.");
  }

  for (const section of REQUIRED_SECTIONS) {
    const sectionIndex = lines.findIndex((line) => line.trim() === section);

    if (sectionIndex === -1) {
      errors.push(`Secao obrigatoria ausente: ${section}`);
      continue;
    }

    if (!hasBulletsAfter(lines, sectionIndex)) {
      errors.push(`A secao ${section} precisa ter pelo menos um item com '- '.`);
    }
  }

  const validationIndex = lines.findIndex((line) => line.trim() === "Validacao:");

  if (validationIndex !== -1 && !hasValidationCheckboxes(lines, validationIndex)) {
    errors.push("A secao Validacao: precisa usar checkboxes no formato '- [ ] ...'.");
  }

  return errors;
};
