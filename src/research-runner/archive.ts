import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export function slugifyTopic(topic: string): string {
  return topic
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

export function writeReportArchive(report: { topic: string; markdown: string }, dateIso: string): string {
  const date = dateIso.slice(0, 10);
  const outputPath = `researches/${date}-${slugifyTopic(report.topic)}.md`;

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, report.markdown, 'utf8');

  return outputPath;
}
