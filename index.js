const fs = require("fs");

const extraTag = "eScape";
const reposMeta = JSON.parse(fs.readFileSync("./meta.json", "utf8"));
const final = [];

async function recoverPlugin(internalName) {
  if (!fs.existsSync("./repo.json")) {
    console.error("!!! Tried to recover plugin when repo isn't generated");
    process.exit(1);
  }

  const oldRepo = JSON.parse(fs.readFileSync("./repo.json", "utf8"));
  const plugin = oldRepo.find((x) => x.InternalName === internalName);
  if (!plugin) {
    console.error(`!!! ${plugin} not found in old repo`);
    process.exit(1);
  }
  FixPlugin(plugin);
  final.push(plugin);
  console.log(`Recovered ${internalName} from last manifest`);
}

async function doRepo(url, plugins) {
  console.log(`Fetching ${url}...`);
  const repo = await fetch(url, {
      headers: {
              'user-agent': 'eScape/1.0.0',
      },
  }).then((res) => res.json());

  for (const internalName of plugins) {
    const plugin = repo.find((x) => x.InternalName === internalName);
    if (!plugin) {
      console.warn(`!!! ${plugin} not found in ${url}`);
      recoverPlugin(internalName);
      continue;
    }

    // Inject our custom tag
    const tags = plugin.Tags || [];
    tags.push(extraTag);
    plugin.Tags = tags;

    FixPlugin(plugin);
    final.push(plugin);
  }
}

async function FixPlugin(plugin){
  // Add Icon
  if(plugin.InternalName == "SimpleHeels"){
    plugin.IconUrl = "https://raw.githubusercontent.com/Murakumo-JP/eScape/main/icon/SimpleHeels.png";
  }
  if(plugin.InternalName == "AntiAfkKick-Dalamud"){
    plugin.IconUrl = "https://raw.githubusercontent.com/Murakumo-JP/eScape/main/icon/AntiAFK.png";
  }
  // Deletes line
  if (plugin.DownloadCount !== undefined) {
    delete plugin.DownloadCount;
  }
  if(plugin.LastUpdate !== undefined) {
    delete plugin.LastUpdate;  
  }
  if(plugin.LastUpdated !== undefined){
    delete plugin.LastUpdated;
  }
}

async function main() {
  for (const meta of reposMeta) {
    try {
      await doRepo(meta.repo, meta.plugins);
    } catch (e) {
      console.error(`!!! Failed to fetch ${meta.repo}`);
      console.error(e);
      for (const plugin of meta.plugins) {
        recoverPlugin(plugin);
      }
    }
  }

  fs.writeFileSync("./repo.json", JSON.stringify(final, null, 2));
  console.log(`Wrote ${final.length} plugins to repo.json.`);
}

main();
