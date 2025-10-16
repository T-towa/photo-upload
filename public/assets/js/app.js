'use strict';

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOW_TYPES = /^image\//;
const SINGLE_UPLOAD = true;

const form = document.getElementById('uploadForm');
const input = document.getElementById('photoInput');
const dz = document.getElementById('dropzone');
const previewUL = document.getElementById('previewList');
const msg = document.getElementById('message');
const result = document.getElementById('result');
const bar = document.getElementById('progress');
const barFill = bar?.querySelector('i');
const submitBtn = document.getElementById('submitBtn');

let selectedFiles = [];
let blobUrls = new Set();

function fileKey(file){return[file.name,file.size,file.type,file.lastModified].join('|')}

document.addEventListener('DOMContentLoaded',()=>{resetUI({clearAll:true})});

input.addEventListener('change',()=>{
  if(!input.files?.length)return;
  addFiles(Array.from(input.files));
  syncInputFiles();
  renderThumbs();
});

['dragenter','dragover'].forEach(ev=>{
  dz.addEventListener(ev,e=>{e.preventDefault();e.stopPropagation();dz.classList.add('dragover')});
});
['dragleave','drop'].forEach(ev=>{
  dz.addEventListener(ev,e=>{e.preventDefault();e.stopPropagation();dz.classList.remove('dragover')});
});
dz.addEventListener('drop',e=>{
  const files=Array.from(e.dataTransfer?.files||[]);
  if(files.length){addFiles(files);syncInputFiles();renderThumbs()}
});

function addFiles(files){
  let added=0;
  for(const f of files){
    if(!ALLOW_TYPES.test(f.type)){showError(`画像以外は追加できません: ${f.name}`);continue}
    if(f.size>MAX_SIZE_BYTES){showError(`サイズ超過 (${formatBytes(MAX_SIZE_BYTES)}まで): ${f.name}`);continue}
    const key=fileKey(f);
    if(selectedFiles.some(x=>x.key===key))continue;
    const url=URL.createObjectURL(f);
    blobUrls.add(url);
    selectedFiles.push({file:f,url,key});
    added++;
  }
  if(added>0)showInfo(`${added} 件を追加しました。`);
}

function syncInputFiles(){
  const dt=new DataTransfer();
  selectedFiles.forEach(x=>dt.items.add(x.file));
  input.files=dt.files;
}

function renderThumbs(){
  previewUL.innerHTML='';
  if(selectedFiles.length===0)return;
  for(const item of selectedFiles){
    const fig=document.createElement('figure');
    fig.className='thumb';
    fig.dataset.key=item.key;

    const img=document.createElement('img');
    img.src=item.url;
    img.alt='選択した写真';

    const close=document.createElement('button');
    close.type='button';
    close.className='thumb-remove';
    close.setAttribute('aria-label','この写真を削除');
    close.textContent='×';
    close.addEventListener('click',()=>removeOne(item.key));

    fig.appendChild(img);
    fig.appendChild(close);
    previewUL.appendChild(fig);
  }
}

function removeOne(key){
  const idx=selectedFiles.findIndex(x=>x.key===key);
  if(idx===-1)return;
  const [removed]=selectedFiles.splice(idx,1);
  try{if(removed?.url&&blobUrls.has(removed.url)){URL.revokeObjectURL(removed.url);blobUrls.delete(removed.url)}}catch{}
  syncInputFiles();
  renderThumbs();
  showInfo('1件削除しました。');
}

function clearAll(){
  try{for(const u of blobUrls)URL.revokeObjectURL(u)}catch{}
  blobUrls.clear();
  selectedFiles=[];
  syncInputFiles();
  renderThumbs();
}

form.addEventListener('submit',async e=>{
  e.preventDefault();
  msg.textContent='';
  result.innerHTML='';
  if(selectedFiles.length===0){showError('画像を選択してください。');return}
  submitBtn.disabled=true;
  showInfo('アップロード中…');
  showProgress(0);
  try{
    const data=await uploadWithProgress('/upload',selectedFiles.map(x=>x.file),p=>showProgress(p));
    if(data?.success){
      showOk('アップロード成功！');
      if(Array.isArray(data.files)){
        const list=data.files.map(f=>{
          const name=escapeHTML(f?.name??'(no-name)');
          const url=escapeAttr(f?.url??'#');
          return `<li><a href="${url}" target="_blank" rel="noopener">${name}</a></li>`;
        }).join('');
        result.innerHTML=`<ul>${list}</ul>`;
      }else if(data.file){
        const name=escapeHTML(data.file?.name??'(no-name)');
        const url=escapeAttr(data.file?.url??'#');
        result.innerHTML=`<a href="${url}" target="_blank" rel="noopener">${name}</a>`;
      }else{
        result.textContent='完了しました。';
      }
      resetUI({clearAll:true});
    }else{
      showError('エラー: '+(data?.error??'不明なエラー'));
    }
  }catch(err){
    console.error(err);
    showError('アップロードに失敗しました。ネットワークを確認してください。');
  }finally{
    submitBtn.disabled=false;
    hideProgressSoon();
  }
});

function uploadWithProgress(url,files,onProgress){
  return new Promise((resolve,reject)=>{
    const xhr=new XMLHttpRequest();
    xhr.open('POST',url);
    xhr.responseType='json';
    xhr.upload.onprogress=e=>{if(e.lengthComputable&&typeof onProgress==='function')onProgress(Math.round((e.loaded/e.total)*100))};
    xhr.onload=()=>{const res=xhr.response||safeParseJSON(xhr.responseText);if(xhr.status>=200&&xhr.status<300)resolve(res);else reject(res||new Error('Upload failed: '+xhr.status))};
    xhr.onerror=()=>reject(new Error('Network error'));
    xhr.onabort=()=>reject(new Error('Aborted'));
    const fd=new FormData();
    if(SINGLE_UPLOAD)fd.append('photo',files[0]);else files.forEach(f=>fd.append('photos[]',f));
    xhr.send(fd);
  });
}

function resetUI({clearAll=false}={}){
  msg.className='msg';
  msg.textContent='';
  result.innerHTML='';
  if(bar){bar.style.display='none';if(barFill)barFill.style.width='0%'}
  if(clearAll){clearAllBlobAndFiles()}
}

function clearAllBlobAndFiles(){
  try{for(const u of blobUrls)URL.revokeObjectURL(u)}catch{}
  blobUrls.clear();
  selectedFiles=[];
  syncInputFiles();
  renderThumbs();
}

function showProgress(percent){
  if(!bar||!barFill)return;
  bar.style.display='block';
  barFill.style.width=Math.max(0,Math.min(100,percent))+'%';
}
function hideProgressSoon(){if(bar)setTimeout(()=>bar.style.display='none',600)}
function showOk(t){msg.className='msg ok';msg.textContent=t}
function showError(t){msg.className='msg err';msg.textContent=t}
function showInfo(t){msg.className='msg';msg.textContent=t}
function formatBytes(b){const u=['B','KB','MB','GB','TB'];let i=0,v=b;while(v>=1024&&i<u.length-1){v/=1024;i++}return `${v.toFixed(v<10&&i?1:0)} ${u[i]}`}
function safeParseJSON(str){try{return JSON.parse(str)}catch{return null}}
function escapeHTML(s=''){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function escapeAttr(s=''){return escapeHTML(String(s))}
