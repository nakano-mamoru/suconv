import { ConvertPage } from './convert-page';

async function main(): Promise<void> {
  const appPlaceholder = document.getElementById('app-placeholder');
  if (!appPlaceholder) {
    throw new Error('Missing required element: #app-placeholder');
  }

  const page = new ConvertPage();
  appPlaceholder.innerHTML = page.getHtml();
  await page.init();
}

void main();
