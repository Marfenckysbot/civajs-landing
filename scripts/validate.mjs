import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const errors = [];

if (html.includes('www.example.com')) errors.push('Remove placeholder canonical/business URLs.');
if (html.includes('embed.tawk.to') || html.includes('googletagmanager.com')) {
  errors.push('Third-party tracking/chat must remain disabled until privacy consent is implemented.');
}
if (html.includes('Your application was received') || html.includes('Subscription confirmed!')) {
  errors.push('Do not show success messages for forms that are not connected.');
}
if (html.includes('```')) errors.push('Remove stray Markdown fences from the HTML document.');
if (!html.includes('Preview only: this form is not connected')) {
  errors.push('The intake form must clearly disclose that it is preview-only.');
}

for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  const attrs = match[1];
  const code = match[2].trim();
  if (!code) continue;
  if (attrs.includes('application/ld+json')) {
    try { JSON.parse(code); } catch (error) {
      errors.push('Invalid JSON-LD structured data: ' + error.message);
    }
  } else if (!/\bsrc=/i.test(attrs)) {
    try { new Script(code); } catch (error) {
      errors.push('Invalid inline JavaScript: ' + error.message);
    }
  }
}

if (errors.length) {
  console.error(['CIVAJS checks failed:', ...errors.map(error => '- ' + error)].join('\n'));
  process.exitCode = 1;
} else {
  console.log('CIVAJS checks passed: inline scripts, structured data and trust disclosures.');
}
