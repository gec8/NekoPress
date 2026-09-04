export async function runAdminBulk(resource:"articles"|"moments"|"comments",ids:(number|string)[],action:string){
  const response=await fetch("/api/admin/bulk",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({resource,ids,action})});
  const payload=await response.json();
  if(!response.ok)throw new Error(payload.error??"批量操作失败");
  return payload;
}
