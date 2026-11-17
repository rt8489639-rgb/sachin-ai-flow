const $ = s => document.querySelector(s);
const pages = ["create","projects","edit"];
let mode = "text", deferredInstall = null, currentVideo = null;
let projects = JSON.parse(localStorage.getItem("sachinProjects") || "[]");
function save(){ localStorage.setItem("sachinProjects", JSON.stringify(projects)); renderProjects(); }
function setPage(p){ pages.forEach(x=>$("#"+x+"Page").classList.toggle("hidden",x!==p)); document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.page===p)); $("#pageTitle").textContent={create:"Create something amazing",projects:"Your creative library",edit:"AI photo editor"}[p]; }
document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>setPage(b.dataset.page));
$("#newProject").onclick=()=>setPage("create");
document.querySelectorAll(".quickcard").forEach(b=>b.onclick=()=>{mode=b.dataset.mode;document.querySelectorAll(".quickcard").forEach(x=>x.classList.toggle("selected",x===b));$("#modeTitle").textContent={text:"Text to video",image:"Image to video",edit:"Edit photo"}[mode];$("#uploadWrap").classList.toggle("hidden",mode!=="image");$("#generate").textContent=mode==="edit"?"✦ Open photo editor →":"✦ Generate video →";if(mode==="edit")setPage("edit");});
async function check(){try{const r=await fetch("/api/status"),d=await r.json();$("#apiDot").classList.toggle("ok",d.configured);$("#apiStatus").textContent=d.wanConfigured?"Wan 2.2 connected":"Add Wan API key";}catch{$("#apiStatus").textContent="Server unavailable";}}
function status(s){$("#previewStatus").textContent=s.toUpperCase();}
function addProject(item){projects.unshift(item);projects=projects.slice(0,30);save();}
$("#enhance").onclick=()=>{const p=$("#prompt");if(!p.value.trim())return p.value="A cinematic, photorealistic scene with a clearly defined subject, natural movement, smooth camera motion, detailed environment, dramatic lighting, rich atmosphere, and polished film color grading.";else p.value=p.value+". Cinematic composition, realistic natural motion, smooth camera movement, detailed lighting and consistent subject appearance.";};
$("#generate").onclick=async()=>{
 const prompt=$("#prompt").value.trim();if(!prompt)return alert("Please describe your video first.");
 const fd=new FormData();fd.append("prompt",prompt);fd.append("ratio",$("#ratio").value);
 const file=$("#imageFile").files[0];if(mode==="image"&&!file)return alert("Please upload a reference image.");
 if(file)fd.append("image",file);
 $("#generate").disabled=true;$("#generate").textContent="Generating…";status("Generating");$("#previewStage").innerHTML='<div class="orb">✦</div><b>Creating your video…</b><small>Keep this page open while Wan processes your request.</small>';
 try{
  const r=await fetch("/api/video",{method:"POST",body:fd});const d=await r.json();if(!r.ok)throw new Error(d.error||"Generation failed");
  let videoData=d.output_video?.data, uri=d.output_video?.uri;
  if(videoData){currentVideo="data:video/mp4;base64,"+videoData;showVideo(currentVideo,prompt);}
  else if(uri){currentVideo=uri;showVideo(uri,prompt);}
  else {throw new Error("Wan provider did not return a video URL. Check Render logs and provider credits.");}
 }catch(e){$("#previewStage").innerHTML='<div class="orb">!</div><b>Could not generate video</b><small>'+escapeHtml(e.message)+'</small>';status("Error");}
 finally{$("#generate").disabled=false;$("#generate").textContent="✦ Generate video →";}
};
function showVideo(src,prompt){$("#previewStage").innerHTML="";const v=document.createElement("video");v.src=src;v.controls=true;v.autoplay=true;v.playsInline=true;$("#previewStage").append(v);$("#resultActions").classList.remove("hidden");$("#downloadVideo").href=src;status("Completed");addProject({type:"video",src,prompt,date:new Date().toLocaleString()});}
$("#editImage").onclick=async()=>{const f=$("#editFile").files[0];if(!f)return alert("Choose a photo first.");const fd=new FormData();fd.append("image",f);fd.append("prompt",$("#editPrompt").value||"Improve this photo with a cinematic look while preserving the main subject.");$("#editImage").disabled=true;$("#editImage").textContent="Editing…";try{const r=await fetch("/api/image-edit",{method:"POST",body:fd}),d=await r.json();if(!r.ok)throw new Error(d.error);$("#editResult").innerHTML="";const img=document.createElement("img");img.src=d.image;$("#editResult").append(img);const a=document.createElement("a");a.href=d.image;a.download="sachin-ai-flow-edited.png";a.className="secondary";a.textContent="↓ Download image";$("#editResult").append(a);addProject({type:"image",src:d.image,prompt:$("#editPrompt").value,date:new Date().toLocaleString()});}catch(e){alert(e.message)}finally{$("#editImage").disabled=false;$("#editImage").textContent="✦ Edit image";}};
$("#speak").onclick=()=>{
 if(!("speechSynthesis" in window))return alert("Speech preview is not supported by this browser. Try Chrome on Android.");
 const text=$("#prompt").value.trim();if(!text)return alert("Please enter text in the prompt first.");
 const lang=$("#voiceLanguage")?.value||"hi-IN", gender=$("#voiceGender")?.value||"male";
 const voices=speechSynthesis.getVoices();
 const matches=voices.filter(v=>v.lang.toLowerCase().replace('_','-').startsWith(lang.toLowerCase().slice(0,2)));
 const genderMatch=matches.find(v=>gender==="female"?/female|woman|swara|kalpana|heera|zira/i.test(v.name):/male|man|madhur|ravi|hemant|david/i.test(v.name));
 const chosen=genderMatch||matches[0];
 const u=new SpeechSynthesisUtterance(text);u.lang=lang;if(chosen)u.voice=chosen;
 speechSynthesis.cancel();speechSynthesis.speak(u);
};
function renderProjects(){const g=$("#projectGrid");g.innerHTML="";if(!projects.length){g.innerHTML='<div class="empty">Your creations will appear here.</div>';return;}projects.forEach(p=>{const card=document.createElement("div");card.className="project";const media=p.type==="video"?document.createElement("video"):document.createElement("img");media.src=p.src;if(p.type==="video")media.controls=true;card.append(media);const b=document.createElement("b");b.textContent=p.prompt||"Untitled project";const sm=document.createElement("small");sm.textContent=(p.type==="video"?"Video":"Image")+" · "+p.date;card.append(b,sm);g.append(card);});}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("#installBtn").classList.remove("hidden");});
$("#installBtn").onclick=async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;};
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));
check();renderProjects();
