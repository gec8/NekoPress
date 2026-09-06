import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

for(const file of [".env.local",".env"]){
  if(existsSync(file))loadEnvFile(file);
}

const required=[
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
];
const missing=required.filter(name=>!process.env[name]?.trim());
const problems=[];
if(missing.length)problems.push(`缺少变量：${missing.join("、")}`);

for(const name of ["NEXT_PUBLIC_SITE_URL","NEXT_PUBLIC_SUPABASE_URL"]){
  const value=process.env[name];
  if(!value)continue;
  try{
    const url=new URL(value);
    if(url.protocol!=="https:")problems.push(`${name} 生产环境必须使用 https`);
    if(["localhost","127.0.0.1"].includes(url.hostname))problems.push(`${name} 仍指向本机地址`);
  }catch{problems.push(`${name} 不是有效网址`)}
}

if(problems.length){
  console.error("生产环境配置未通过：");
  for(const problem of problems)console.error(`- ${problem}`);
  process.exit(1);
}

console.log("生产环境变量检查通过（密钥内容未输出）。");
