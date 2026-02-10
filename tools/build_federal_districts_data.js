#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const DEFAULT_URL =
  'https://ftp.maps.canada.ca/pub/elections_elections/Electoral-districts_Circonscription-electorale/federal_electoral_districts_boundaries_2023/FED_CA_2023_EN-SHP.zip';

const OUTPUT_PATH = path.resolve(__dirname, '../mobile/src/data/federalDistricts2023.json');
const TMP_DIR = path.resolve(__dirname, '../tmp');
const ZIP_PATH = path.join(TMP_DIR, 'FED_CA_2023_EN-SHP.zip');

const NAME_FIELD = process.env.DISTRICT_NAME_FIELD || 'FEDENAME';
const ID_FIELD = process.env.DISTRICT_ID_FIELD || 'FEDUID';
const SOURCE_URL = process.env.DISTRICT_ZIP_URL || DEFAULT_URL;
const SHP_PATH = process.env.DISTRICT_SHP_PATH || '';
const SIMPLIFY = process.env.DISTRICT_SIMPLIFY || '8%';

const ensureTmp = () => {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }
};

const download = (url, dest) =>
  new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed: HTTP ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      })
      .on('error', (err) => {
        fs.unlink(dest, () => reject(err));
      });
  });

const run = async () => {
  ensureTmp();

  let inputPath = SHP_PATH;
  if (!inputPath) {
    if (!fs.existsSync(ZIP_PATH)) {
      console.log(`Downloading ${SOURCE_URL}`);
      await download(SOURCE_URL, ZIP_PATH);
    } else {
      console.log(`Using cached ${ZIP_PATH}`);
    }
    inputPath = ZIP_PATH;
  } else if (!fs.existsSync(inputPath)) {
    throw new Error(`Shapefile not found at ${inputPath}`);
  }

  console.log('Building simplified GeoJSON...');
  const cmd = [
    'npx',
    'mapshaper',
    `-i ${inputPath}`,
    '-proj wgs84',
    '-clean',
    `-simplify ${SIMPLIFY} keep-shapes`,
    `-rename-fields name=${NAME_FIELD},id=${ID_FIELD}`,
    `-o format=geojson ${OUTPUT_PATH}`,
  ].join(' ');

  execSync(cmd, { stdio: 'inherit' });
  console.log(`Wrote ${OUTPUT_PATH}`);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
