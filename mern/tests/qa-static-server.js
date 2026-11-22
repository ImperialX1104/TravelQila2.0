import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.cwd(),process.env.QA_ROOT || "..");
const mime = {
  ".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",
  ".js":"text/javascript; charset=utf-8",".json":"application/json",
  ".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",
  ".webp":"image/webp",".svg":"image/svg+xml",".woff":"font/woff",
  ".woff2":"font/woff2",".ico":"image/x-icon"
};

const server = createServer(async (request,response)=>{
  try {
    const pathname = decodeURIComponent(new URL(request.url,"http://127.0.0.1").pathname);
    const requested = path.resolve(root,"."+pathname);
    if (requested !== root && !requested.startsWith(root+path.sep)) throw new Error("Invalid path");
    let target = requested;
    if ((await stat(target).catch(()=>null))?.isDirectory()) target = path.join(target,"index.html");
    const body = await readFile(target);
    response.writeHead(200,{"content-type":mime[path.extname(target).toLowerCase()]||"application/octet-stream"});
    response.end(body);
  } catch {
    response.writeHead(404,{"content-type":"text/plain; charset=utf-8"});
    response.end("Not found");
  }
});

server.listen(3001,"127.0.0.1");
