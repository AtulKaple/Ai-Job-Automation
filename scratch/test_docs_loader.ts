import { loadProjectDocsFromStorage } from '../server/projectDocsLoader';

const docs = loadProjectDocsFromStorage();
console.log(`Loaded ${docs.length} project docs from storage/projectDocs:`);
for (const d of docs) {
  console.log(`\n=== [${d.id}] ${d.title} ===`);
  console.log(`Role: ${d.role} | Context: ${d.companyOrContext} (${d.category})`);
  console.log(`Tech count: ${d.technologies.length} | e.g.: ${d.technologies.slice(0, 5).join(', ')}`);
  console.log(`Achievements count: ${d.keyAchievements.length}`);
  console.log(`Bullets pool count: ${d.bulletPointsPool.length}`);
  if (d.bulletPointsPool.length > 0) {
    console.log(`First bullet: ${d.bulletPointsPool[0].slice(0, 100)}...`);
  }
}
