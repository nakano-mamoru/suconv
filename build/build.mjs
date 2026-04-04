import { build, context } from 'esbuild';
import { promises as fs } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { compileAsync } from 'sass';

const rootDir = process.cwd();
const sourceHtmlPath = path.join(rootDir, 'src', 'html', 'index.html');
const convertPageHtmlPath = path.join(rootDir, 'src', 'html', 'convert-page.html');
const appLogoSvgPath = path.join(rootDir, 'src', 'svg', 'app-logo.svg');
const sourceScssDir = path.join(rootDir, 'src', 'scss');
const generatedTsDir = path.join(rootDir, 'src', 'ts', 'generated');
const generatedThemesPath = path.join(generatedTsDir, 'style-themes.ts');
const generatedConvertPageHtmlPath = path.join(generatedTsDir, 'convert-page-html.ts');
const generatedBuildInfoPath = path.join(generatedTsDir, 'build-info.ts');
const modernNormalizeCssPath = path.join(rootDir, 'node_modules', 'modern-normalize', 'modern-normalize.css');
const targetDir = path.join(rootDir, 'target');
const watchMode = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: { app: path.join('src', 'ts', 'main.ts') },
  outdir: targetDir,
  entryNames: 'app.[hash]',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2019'],
  metafile: true,
  logLevel: 'info',
};

async function prepareTargetDirectory() {
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(targetDir, { recursive: true });
}

function resolveEntryJsName(metafile) {
  const outputEntries = Object.entries(metafile.outputs);
  const entryJsOutputs = outputEntries.filter(([, output]) => output.entryPoint && output.entryPoint.endsWith('main.ts'));

  if (entryJsOutputs.length !== 1) {
    throw new Error('Failed to resolve bundled entry JavaScript output.');
  }

  return path.basename(entryJsOutputs[0][0]);
}

async function writeOutputHtml(metafile) {
  const entryJsName = resolveEntryJsName(metafile);
  const appLogoSvg = await fs.readFile(appLogoSvgPath, 'utf8');
  const templateHtml = await fs.readFile(sourceHtmlPath, 'utf8');
  const outputHtml = templateHtml
    .replace('<!-- __APP_LOGO__ -->', appLogoSvg.trim())
    .replace('__APP_JS__', entryJsName);
  const outputHtmlPath = path.join(targetDir, 'index.html');
  await fs.writeFile(outputHtmlPath, outputHtml, 'utf8');
}

function parseThemeMeta(cssText, fallbackId) {
  const lines = cssText.split(/\r?\n/);
  const idLine = lines[0] ?? '';
  const nameLine = lines[1] ?? '';

  const idMatch = idLine.match(/\/\*\s*theme-id\s*:\s*([^*]+?)\s*\*\//i);
  const nameMatch = nameLine.match(/\/\*\s*theme-name\s*:\s*([^*]+?)\s*\*\//i);

  return {
    id: idMatch?.[1]?.trim() || fallbackId,
    name: nameMatch?.[1]?.trim() || fallbackId,
  };
}

async function writeStyleThemesModule(themeDefinitions) {
  await fs.mkdir(generatedTsDir, { recursive: true });

  const output = [
    'export const styleThemes = [',
    ...themeDefinitions.map((theme) => `  { id: ${JSON.stringify(theme.id)}, name: ${JSON.stringify(theme.name)} },`),
    '] as const;',
    '',
  ].join('\n');

  await fs.writeFile(generatedThemesPath, output, 'utf8');
}

async function generateConvertPageHtmlModule() {
  await fs.mkdir(generatedTsDir, { recursive: true });

  const htmlContent = await fs.readFile(convertPageHtmlPath, 'utf8');
  const escapedHtml = htmlContent
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');

  const output = [
    'export const convertPageHtml = `' + escapedHtml + '`;',
    '',
  ].join('\n');

  await fs.writeFile(generatedConvertPageHtmlPath, output, 'utf8');
}

async function generateBuildInfoModule() {
  await fs.mkdir(generatedTsDir, { recursive: true });

  const buildDate = new Date().toISOString();
  let gitBranch = 'unknown';
  let gitCommit = 'unknown';

  try {
    gitBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: rootDir,
      encoding: 'utf8',
    }).trim();
  } catch {
    // Git not available or not in a git repository
  }

  try {
    gitCommit = execSync('git rev-parse HEAD', {
      cwd: rootDir,
      encoding: 'utf8',
    }).trim();
  } catch {
    // Git not available or not in a git repository
  }

  const output = [
    'export const buildInfo = {',
    `  buildDate: ${JSON.stringify(buildDate)},`,
    `  gitBranch: ${JSON.stringify(gitBranch)},`,
    `  gitCommit: ${JSON.stringify(gitCommit)},`,
    '} as const;',
    '',
  ].join('\n');

  await fs.writeFile(generatedBuildInfoPath, output, 'utf8');
}

async function compileScss(filePath) {
  const result = await compileAsync(filePath, {
    style: 'expanded',
  });

  return result.css;
}

async function bundleCssAssets() {
  const parts = [];
  const themeDefinitions = [];

  const modernNormalizeCss = await fs.readFile(modernNormalizeCssPath, 'utf8');
  parts.push(modernNormalizeCss);

  const mainCss = await compileScss(path.join(sourceScssDir, 'main.scss'));
  parts.push(mainCss);

  const themeDir = path.join(sourceScssDir, 'theme');
  const themeFiles = (await fs.readdir(themeDir))
    .filter((f) => f.endsWith('.scss'))
    .sort();

  for (const fileName of themeFiles) {
    const sourcePath = path.join(themeDir, fileName);
    const source = await fs.readFile(sourcePath, 'utf8');
    const css = await compileScss(sourcePath);
    const fallbackId = fileName.replace(/\.scss$/i, '');
    themeDefinitions.push(parseThemeMeta(source, fallbackId));
    parts.push(css);
  }

  await writeStyleThemesModule(themeDefinitions);
  await fs.writeFile(path.join(targetDir, 'app.css'), parts.join('\n'), 'utf8');
}

async function runBuild() {
  await prepareTargetDirectory();
  await bundleCssAssets();
  await generateConvertPageHtmlModule();
  await generateBuildInfoModule();
  const result = await build(buildOptions);
  await writeOutputHtml(result.metafile);
}

async function runWatch() {
  await prepareTargetDirectory();
  await bundleCssAssets();
  await generateConvertPageHtmlModule();
  await generateBuildInfoModule();

  const ctx = await context({
    ...buildOptions,
    plugins: [
      {
        name: 'emit-html',
        setup(pluginBuild) {
          pluginBuild.onStart(async () => {
            await bundleCssAssets();
            await generateConvertPageHtmlModule();
            await generateBuildInfoModule();
          });

          pluginBuild.onEnd(async (result) => {
            if (result.errors.length > 0 || !result.metafile) {
              return;
            }
            await writeOutputHtml(result.metafile);
          });
        },
      },
    ],
  });

  await ctx.watch();
  console.log('Watching for changes...');
}

if (watchMode) {
  runWatch().catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else {
  runBuild().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
