import fs from 'fs';
const file = 'c:\\desenvolvimento\\tmsembarcador\\src\\services\\logsService.ts';
let code = fs.readFileSync(file, 'utf8');

const newFunc = `async function getContextIds(): Promise<{ organizationId: string | null; environmentId: string | null }> {
  try {
    const ctx = await TenantContextHelper.getCurrentContext();
    if (!ctx || !ctx.organizationId || !ctx.environmentId) {
      return { organizationId: null, environmentId: null };
    }
    return {
      organizationId: ctx.organizationId,
      environmentId: ctx.environmentId
    };
  } catch (error) {
    return { organizationId: null, environmentId: null };
  }
}`;

// Matches from 'async function getContextIds()' to the second '}' (the end of the function in the file)
code = code.replace(/async function getContextIds\(\)[\s\S]*?\n\}/, newFunc);
fs.writeFileSync(file, code, 'utf8');
console.log('Fixed logsService.ts');
