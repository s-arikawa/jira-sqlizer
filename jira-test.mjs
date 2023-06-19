import 'dotenv/config'
import { Version3Client } from 'jira.js';
import { PrismaClient } from "@prisma/client";

const env = process.env

const prisma = new PrismaClient()
const client = new Version3Client({
  host: env.JIRA_HOST,
  authentication: {
    basic: {
      email: env.JIRA_EMAIL,
      apiToken: env.JIRA_API_TOKEN,
    },
  },
  newErrorHandling: true,
});

async function main() {
  try {
    const projects = await client.projects.searchProjects({ expand: ["url", "description", "issueTypes", "lead", "projectKeys", "insight"] })

    // User を先に作成
    await prisma.user.createMany({
      data: projects.values.map((project) => {
        const lead = project.lead
        return {
          accountId: lead.accountId,
          accountType: lead.accountType,
          displayName: lead.displayName,
          active: lead.active,
        }
      }),
      skipDuplicates: true
    })

    await prisma.project.createMany({
      data: projects.values.map((project) => {
        return {
          id: project.id,
          key: project.key,
          description: project.description,
          leadAccountId: project.lead.accountId,
          name: project.name,
          projectTypeKey: project.projectTypeKey,
          simplified: project.simplified,
          style: project.style,
          isPrivate: project.isPrivate
        }
      }),
      skipDuplicates: true
    })
  } catch (e) {
    console.error(e)
  }
}

main();
