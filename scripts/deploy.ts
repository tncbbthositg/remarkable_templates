import fs from 'fs';

import glob from 'glob';
import { Command } from 'commander';
import Client, { ConnectOptions } from 'ssh2-sftp-client';

interface RemarkableTemplate {
  name: string;
  filename: string;
  iconCode: string;
  landscape?: boolean;
  categories: string[];
}

interface RemarkableTemplates {
  templates: RemarkableTemplate[];
}

const CUSTOM_TEMPLATES_FOLDER = './templates';
const CUSTOMIZATION_ROOT = '/usr/share/remarkable/templates';
const TEMPLATES_FILE = `${CUSTOMIZATION_ROOT}/templates.json`;

async function getCurrentTemplates(client: Client): Promise<RemarkableTemplates> {
  const data = await client.get(TEMPLATES_FILE);
  return JSON.parse(data.toString()) as RemarkableTemplates;
}

async function writeNewTemplates(client: Client, templates: RemarkableTemplates) {
  console.log(`Updating ${TEMPLATES_FILE}.`);
  const data = JSON.stringify(templates, null, 2);
  await client.put(Buffer.from(data), TEMPLATES_FILE);
}

async function addCustomTemplates(client: Client): Promise<RemarkableTemplates> {
  const customTemplates = glob.sync(`${CUSTOM_TEMPLATES_FOLDER}/**/*.json`);
  let { templates } = await getCurrentTemplates(client);

  const copies = customTemplates.map((customTemplateFile: string) => {
    console.log('Found custom template: ', customTemplateFile);

    const templateData = fs.readFileSync(customTemplateFile).toString();
    const newTemplate = JSON.parse(templateData) as RemarkableTemplate;

    const previousLength = templates.length;
    templates = templates.filter((template) => template.name != newTemplate.name);
    const newLength = templates.length;

    if (previousLength != newLength) {
      console.log(`Removed ${previousLength - newLength} existing template(s).`);
    }

    templates.push(newTemplate);
    return copyTemplateFile(client, newTemplate.filename);
  });

  await Promise.all(copies);

  templates = templates.sort((a, b) => a.name < b.name ? -1 : 1);
  return { templates };
}

async function copyTemplateFile(client: Client, templateName: string) {
  const templateFiles = glob.sync(`${CUSTOM_TEMPLATES_FOLDER}/**/${templateName}.!(json)`);
  const fileCopies = templateFiles.map((file) => {
    const destination = `${CUSTOMIZATION_ROOT}/${file.split('/').reverse()[0]}`;
    console.log('Copying template', file, 'to', destination);
    return client.fastPut(file, destination);
  });

  return Promise.all(fileCopies);
}

new Command()
  .version('1.0.0')
  .arguments('<host> <password>')
  .description('Publish custom templates to reMarkable tablet.')
  .action(async (host: string, password: string) => {
    const sshOptions: ConnectOptions = { username: 'root', host, password };
    const client = new Client();
    await client.connect(sshOptions);

    try {
      const newTemplates = await addCustomTemplates(client);
      await writeNewTemplates(client, newTemplates);
    } finally {
      await client.end();
    }
  })
  .parseAsync(process.argv);

