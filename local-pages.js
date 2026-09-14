(()=>{
const calendar=document.querySelector('#calendar');
if(calendar){
 const events=window.DARBY_EVENTS||[];let month=new Date();month=new Date(month.getFullYear(),month.getMonth(),1);let day=null;
 const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
 const search=document.querySelector('#search'),list=document.querySelector('#events'),label=document.querySelector('#month');
 function render(){
  label.textContent=month.toLocaleDateString('en-US',{month:'long',year:'numeric'});calendar.replaceChildren();list.replaceChildren();
  const q=search.value.trim().toLowerCase(),prefix=key(month);const filtered=events.filter(e=>e.start.startsWith(prefix)&&(e.title+' '+e.location).toLowerCase().includes(q));
  for(const name of ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']){const el=document.createElement('strong');el.textContent=name;calendar.append(el)}
  for(let i=0;i<month.getDay();i++){const el=document.createElement('div');el.setAttribute('aria-hidden','true');calendar.append(el)}
  const count=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
  for(let n=1;n<=count;n++){
   const date=prefix+'-'+String(n).padStart(2,'0'),matches=filtered.filter(e=>e.start.slice(0,10)<=date&&e.end.slice(0,10)>=date);
   const b=document.createElement('button');b.type='button';b.className='day'+(day===date?' selected':'');b.textContent=n;b.setAttribute('aria-pressed',String(day===date));b.setAttribute('aria-label',date+', '+matches.length+' events');
   const small=document.createElement('small');small.textContent=matches.length?`${matches.length} events`:'';b.append(small);b.onclick=()=>{day=day===date?null:date;render()};calendar.append(b);
  }
  const visible=day?filtered.filter(e=>e.start.slice(0,10)<=day&&e.end.slice(0,10)>=day):filtered;
  document.querySelector('#count').textContent=`${visible.length} events${day?' for '+day:' this month'} · Times shown in Eastern Time`;
  if(!visible.length){const p=document.createElement('p');p.textContent='No matching events in this imported snapshot.';list.append(p)}
  for(const event of visible){const article=document.createElement('article');article.className='event';const h=document.createElement('h3');h.textContent=event.title;article.append(h);const p=document.createElement('p');p.textContent=event.start.length===10?event.start+' · All day':new Date(event.start).toLocaleString('en-US',{timeZone:'America/New_York',weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' – '+new Date(event.end).toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});article.append(p);const loc=document.createElement('p');loc.textContent=event.location;article.append(loc);list.append(article)}
 }
 document.querySelector('#prev').onclick=()=>{month.setMonth(month.getMonth()-1);day=null;render()};document.querySelector('#next').onclick=()=>{month.setMonth(month.getMonth()+1);day=null;render()};document.querySelector('#all').onclick=()=>{day=null;render()};search.oninput=render;render();
}
const form=document.querySelector('#absence-draft');if(form){form.addEventListener('submit',e=>e.preventDefault());document.querySelector('#print').onclick=()=>window.print()}
})();
