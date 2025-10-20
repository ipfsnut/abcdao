#!/usr/bin/env node

import { App } from '@octokit/app';
import dotenv from 'dotenv';

dotenv.config();

async function checkGitHubAppInstallations() {
  console.log('🔍 Checking GitHub App installations...');
  
  try {
    const app = new App({
      appId: process.env.GITHUB_APP_ID,
      privateKey: process.env.GITHUB_APP_PRIVATE_KEY,
    });

    // Get all installations
    const installations = await app.octokit.rest.apps.listInstallations();
    console.log(`📋 Found ${installations.data.length} installations:`);
    
    for (const installation of installations.data) {
      console.log(`\n🏢 Installation ID: ${installation.id}`);
      console.log(`   Account: ${installation.account.login}`);
      console.log(`   Type: ${installation.account.type}`);
      
      // Get repositories for this installation
      try {
        const installationOctokit = await app.getInstallationOctokit(installation.id);
        const repos = await installationOctokit.rest.apps.listReposAccessibleToInstallation();
        
        console.log(`   📚 Accessible repositories (${repos.data.total_count}):`);
        repos.data.repositories.forEach(repo => {
          console.log(`      - ${repo.full_name}`);
        });
      } catch (repoError) {
        console.log(`   ❌ Error getting repositories: ${repoError.message}`);
      }
    }
  } catch (error) {
    console.error('❌ Error checking installations:', error.message);
  }
}

checkGitHubAppInstallations().then(() => {
  console.log('\n✨ Check complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});