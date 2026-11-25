// The code shown on the hero stage, and a small tokeniser so each part can be given its
// own weight or colour. Shared by both hero styles.

export const CODE_LINES = [
  '<!-- huzaifamalik.me -->',
  '<section class="hero">',
  '  <h1>Web developer building</h1>',
  '  <h1>websites that feel alive.</h1>',
  '</section>',
  '',
  'const huzaifa = {',
  "  role: 'developer + designer',",
  "  based: 'Pakistan',",
  '  since: 2020,',
  "  stack: ['WordPress', 'Shopify', 'React'],",
  '  available: true,',
  '};',
  '',
  'function build(idea) {',
  '  const design = sketch(idea);',
  '  const site = code(design);',
  '  return launch(site);',
  '}',
  '',
  '.site {',
  '  speed: fast;',
  '  layout: responsive;',
  '  details: considered;',
  '}',
  '',
  "add_action('init', 'register_theme');",
  "<?php get_template_part('hero'); ?>",
  '',
  '@media (max-width: 700px) {',
  '  .grid { grid-template-columns: 1fr; }',
  '}',
  '',
  'while (!client.isHappy) refine(site);',
  'git commit -m "ship it"',
  '',
];

const TOKEN = /(<!--.*?-->|'[^']*'|"[^"]*"|\b(?:const|function|return|while|true|class|section|h1|php)\b|\d+|[{}()[\];,<>=/:!?.@-]+)/g;

function kindOf(part) {
  if (part.startsWith('<!--')) return 'comment';
  if (/^['"]/.test(part)) return 'string';
  if (/^(?:const|function|return|while|true|class|section|h1|php)$/.test(part)) return 'keyword';
  if (/^\d+$/.test(part)) return 'number';
  if (/^[{}()[\];,<>=/:!?.@-]+$/.test(part)) return 'punctuation';
  return 'plain';
}

// Splits a line into parts, each with the kind of token it is.
export function tokens(line) {
  return line
    .split(TOKEN)
    .filter(Boolean)
    .map((text) => ({ text, kind: kindOf(text) }));
}
