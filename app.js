/* ============ KONFIGURASI (isi bagian ini) ============ */
var firebaseConfig = {
  apiKey: "AIzaSyC5jsjs5eOkiU7xZxfCcYjC6cGivZql8BU",
  authDomain: "kope-digital-technology.firebaseapp.com",
  projectId: "kope-digital-technology",
  appId: "1:957517114720:web:1076ea32640f4de9dc4205"
};
var acAktif=false,acSumber='';
var APPCHECK_SITE_KEY = ""; // isi dengan site key reCAPTCHA v3 dari Firebase Console > App Check. Kosong = App Check belum aktif.
var ADMIN_EMAIL = "kopedigitaltechnology@gmail.com"; // hanya email ini yang menjadi admin
var co={}; // data perusahaan diambil dari server (Firestore: settings/company)
/* ======================================================= */

try{if(window.top!==window.self){document.body.innerHTML='';}}catch(e){document.body.innerHTML=''}
var $=function(i){return document.getElementById(i)};
function aman(u){try{var x=new URL(u);return x.protocol==='https:'?x.href:''}catch(e){return ''}}
var rupiah=function(n){return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n)};
function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e}
function note(box,text,type){box.className='msg '+(type||'');box.textContent=text}

/* tema terang/gelap (default terang) */
function setTema(t,simpan){document.documentElement.setAttribute('data-theme',t);if(simpan){try{localStorage.setItem('kope-tema',t)}catch(e){}}var b=$('nTema');b.textContent=t==='dark'?'Mode terang':'Mode gelap';b.setAttribute('aria-pressed',t==='dark'?'true':'false')}
setTema(document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light',false);
$('nTema').onclick=function(){setTema(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark',true)};

/* menu HP */
$('menu').onclick=function(){var o=$('nav').classList.toggle('open');$('menu').setAttribute('aria-expanded',o)};
$('nav').onclick=function(){$('nav').classList.remove('open')};

/* kontak (dari server) */
function renderKontak(){var b=$('kontakInfo');b.innerHTML='';
  function kartu(t,v,href){var c=el('div','card');c.appendChild(el('h3','',t));
    if(!v){c.appendChild(el('p','ph','Belum diisi'))}else if(href){var a=el('a','',v);a.href=href;a.style.textDecoration='underline';a.rel='noopener noreferrer';var q=el('p');q.appendChild(a);c.appendChild(q)}else c.appendChild(el('p','',v));b.appendChild(c)}
  var tel=(co.telepon||'').replace(/[^0-9+]/g,''),wa=(co.wa||'').replace(/\D/g,''),em=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(co.email||'')?co.email:'';
  var mp=aman(co.maps)||(co.alamat?'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(co.alamat):'');
  kartu(co.nama||'Alamat kantor',co.alamat,mp);kartu('Email',em,em?'mailto:'+em:'');kartu('Telepon',co.telepon,tel?'tel:'+tel:'');
  kartu('WhatsApp',wa?'+'+wa:'',wa?'https://wa.me/'+wa:'');kartu('Jam operasional',co.jam,'');renderHarga()}
function renderHarga(){var b=$('hargaBox');b.innerHTML='';b.appendChild(el('h3','','Biaya langganan website'));
  var hb=Number(co.hargaBulan)||0,ht=Number(co.hargaTahun)||0;
  b.appendChild(el('p',hb||ht?'price':'ph',hb||ht?(hb?rupiah(hb)+' per bulan':'')+(hb&&ht?' atau ':'')+(ht?rupiah(ht)+' per tahun':''):'Harga segera diumumkan.'));
  b.appendChild(el('p','small','Jika pembayaran melewati tanggal jatuh tempo, website dinonaktifkan sementara (tampil error). Jika dalam 10 hari setelah jatuh tempo belum dibayar, website dihapus.'));
  var wa=(co.wa||'').replace(/\D/g,''),tel=(co.telepon||'').replace(/[^0-9+]/g,'');
  if(wa||tel){var r=el('div','btns');r.style.justifyContent='flex-start';
    if(wa){var a=el('a','btn sm','WhatsApp admin');a.href='https://wa.me/'+wa;a.target='_blank';a.rel='noopener noreferrer';r.appendChild(a)}
    if(tel){var t=el('a','btn sm','Telepon '+co.telepon);t.href='tel:'+tel;r.appendChild(t)}b.appendChild(r)}}
renderKontak();

/* panel */
var PANELS=['masuk','pesanan','admin'],VIEWS=['beranda','produk','beta','profil','privasi','lokasi','detail'],curId=null;
function route(){
  var h=(location.hash||'#beranda').slice(1);
  if(h.indexOf('p/')===0){curId=h.slice(2);h='detail'}
  var p=PANELS.indexOf(h)>=0?h:null;
  if((p==='pesanan'||p==='admin')&&!user){p='masuk';}
  if(p==='admin'&&!isAdmin){p=null;}
  var v=p?null:(VIEWS.indexOf(h)>=0?h:'beranda');
  $('umum').style.display=p?'none':'block';
  VIEWS.forEach(function(n){$(n).classList.toggle('on',n===v)});
  if(v==='detail')openDetail();
  if(v==='beta')loadBeta();
  window.scrollTo(0,0);
  PANELS.forEach(function(n){$('p-'+n).classList.toggle('on',n===p)});
  if(p==='pesanan')loadMine();
  if(p==='admin')loadAdmin();
}
window.addEventListener('hashchange',route);

var balik=null;$('keMasuk').onclick=function(){balik='layanan'};
var db,auth,user=null,isAdmin=false,produk=[],cart=[],resmi=false,started=false,verData={},cerita={},beranda={},mulai=function(){};
if(firebaseConfig.apiKey.indexOf('ISI')===0){
  $('warn').style.display='block';$('daftarProduk').innerHTML='';$('daftarProduk').appendChild(el('p','ph','Produk muncul setelah Firebase diisi.'));route();
}else{
  firebase.initializeApp(firebaseConfig);
  aktifkanAc(APPCHECK_SITE_KEY,'kode');try{aktifkanAc(localStorage.getItem('kope-ack'),'cache')}catch(e){}auth=firebase.auth();db=firebase.firestore();
  db.collection('settings').doc('appcheck').get().then(function(d){var k=d.exists?d.data().siteKey:'';if(ackOk(k)){try{localStorage.setItem('kope-ack',k)}catch(e){}aktifkanAc(k,'server')}else{try{localStorage.removeItem('kope-ack')}catch(e){}}}).catch(function(){});
  mulai=function(){if(started)return;started=true;
  db.collection('home').onSnapshot(function(s){home=s.docs.map(function(d){var x=d.data();x.id=d.id;return x});renderHome();if($('p-admin').classList.contains('on'))loadHome()},function(){});
  db.collection('settings').doc('footer').onSnapshot(function(d){foot=d.exists?d.data():{};renderFooter()},function(){renderFooter()});
  db.collection('settings').doc('sosial').onSnapshot(function(d){sos=d.exists&&Array.isArray(d.data().daftar)?d.data().daftar:[];renderSosial()},function(){});
  db.collection('settings').doc('company').onSnapshot(function(d){co=d.exists?d.data():{};renderKontak()},function(){});
  db.collection('settings').doc('cerita').onSnapshot(function(d){cerita=d.exists?d.data():{};renderCerita();if($('p-admin').classList.contains('on'))fillIsi()},function(){});
  db.collection('settings').doc('beranda').onSnapshot(function(d){beranda=d.exists?d.data():{};renderBeranda();if($('p-admin').classList.contains('on'))fillIsi()},function(){});
  db.collection('products').onSnapshot(function(s){produk=s.docs.map(function(d){var x=d.data();x.id=d.id;return x});renderProduk();renderBetaApps();if($('detail').classList.contains('on'))openDetail();if($('p-admin').classList.contains('on'))loadAdmin()},function(){$('daftarProduk').textContent='Produk belum bisa dimuat.'});
  };
  auth.onAuthStateChanged(function(u){user=u;isAdmin=!!u&&u.emailVerified&&(u.email||'').toLowerCase()===ADMIN_EMAIL;if(isAdmin)mulai();afterAuth()});
  db.collection('settings').doc('verifikasi').get().then(function(d){verData=d.exists?d.data():{};resmi=verData.aktif===true&&verData.domain===location.hostname;document.body.classList.toggle('resmiOk',resmi);if(resmi)mulai();else tampilPalsu(!d.exists?'belum-diatur':verData.aktif!==true?'tidak-aktif':'domain-beda')}).catch(function(){tampilPalsu('akses-ditolak')});
}
function tampilPalsu(why){var b=$('palsu');b.innerHTML='';
  b.appendChild(document.createTextNode(verData.pesan||'Situs ini tidak terverifikasi sebagai situs resmi.'));
  var u=aman(verData.url);if(u){b.appendChild(document.createTextNode(' Situs resmi: '));var a=el('a','',u);a.href=u;a.rel='noopener noreferrer';a.style.textDecoration='underline';b.appendChild(a)}
  b.appendChild(el('div','small','Kode: '+why));b.style.display='block'}
var idle;
function resetIdle(){clearTimeout(idle);if(isAdmin)idle=setTimeout(function(){auth.signOut();alert('Sesi admin berakhir karena tidak aktif selama 30 menit.')},1800000)}
['click','keydown','touchstart'].forEach(function(ev){document.addEventListener(ev,resetIdle,{passive:true})});
function afterAuth(){
  resetIdle();
  if(user&&!$('ovLogin').hidden)tutupOv();
  $('verif').style.display=(user&&!user.emailVerified&&(user.email||'').toLowerCase()===ADMIN_EMAIL)?'block':'none';
  $('nPesanan').hidden=!user;$('nAdmin').hidden=!isAdmin;$('nMasuk').hidden=!!user;$('nKeluar').hidden=!user;
  $('fLayanan').hidden=!user;$('layananLogin').hidden=!!user;
  if(user&&location.hash==='#masuk'){location.hash=balik?'#'+balik:'#beranda';balik=null}
  var f=$('fLayanan');if(user){if(!f.name.value)f.name.value=user.displayName||'';if(!f.email.value)f.email.value=user.email||''}
  route();
}
$('nKeluar').onclick=function(){auth.signOut();location.hash='#beranda'};

/* masuk / daftar */
var daftar=false;
$('ganti').onclick=function(e){e.preventDefault();daftar=!daftar;$('lNama').hidden=!daftar;$('lSetuju').style.display=daftar?'flex':'none';$('cSetuju').required=daftar;$('judulMasuk').textContent=daftar?'Daftar':'Masuk';$('bMasuk').textContent=daftar?'Daftar':'Masuk';$('ganti').textContent=daftar?'Sudah punya akun? Masuk':'Belum punya akun? Daftar'};
function galat(e){var c=e&&e.code||'';
  if(c.indexOf('email-already')>=0)return 'Email ini sudah terdaftar.';
  if(c.indexOf('weak-password')>=0)return 'Kata sandi terlalu lemah.';
  if(c.indexOf('too-many')>=0)return 'Terlalu banyak percobaan. Coba lagi nanti.';
  if(c.indexOf('permission')>=0)return 'Tidak diizinkan. Pastikan email Anda sudah terverifikasi.';
  return 'Email atau kata sandi tidak cocok.'}
var gagalMasuk=0,kunciSampai=0;
$('fMasuk').onsubmit=function(e){e.preventDefault();var f=e.target,m=$('mMasuk');
  if(Date.now()<kunciSampai){note(m,'Terlalu banyak percobaan. Tunggu satu menit.','err');return}
  if(daftar&&!(f.pw.value.length>=8&&/[A-Za-z]/.test(f.pw.value)&&/[0-9]/.test(f.pw.value))){note(m,'Kata sandi minimal 8 karakter dan memuat huruf serta angka.','err');return}
  note(m,'Memproses…');
  if(!auth){note(m,'Firebase belum diisi.','err');return}
  var p=daftar?auth.createUserWithEmailAndPassword(f.email.value,f.pw.value).then(function(c){return c.user.updateProfile({displayName:f.nama.value.trim()}).then(function(){return c.user.sendEmailVerification()})}):auth.signInWithEmailAndPassword(f.email.value,f.pw.value);
  p.then(function(){gagalMasuk=0;f.reset();note(m,'')}).catch(function(x){if(++gagalMasuk>=5){kunciSampai=Date.now()+60000;gagalMasuk=0}note(m,galat(x),'err')})};
$('bGoogle').onclick=function(){var m=$('mMasuk');if(!auth){note(m,'Firebase belum diisi.','err');return}
  auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(function(){note(m,'Masuk dengan Google gagal. Coba lagi.','err')})};
$('kirimUlang').onclick=function(){if(user)user.sendEmailVerification().then(function(){alert('Email verifikasi dikirim.')}).catch(function(){alert('Coba lagi beberapa menit lagi.')})};
$('sudahVerif').onclick=function(){if(!user)return;user.reload().then(function(){return user.getIdToken(true)}).then(function(){isAdmin=user.emailVerified&&(user.email||'').toLowerCase()===ADMIN_EMAIL;if(isAdmin)mulai();afterAuth()})};
$('lupa').onclick=function(e){e.preventDefault();var em=$('fMasuk').email.value,m=$('mMasuk');
  if(!em){note(m,'Isi email dulu, lalu tekan Lupa kata sandi.','err');return}
  auth.sendPasswordResetEmail(em).then(function(){note(m,'Jika email terdaftar, tautan reset sudah dikirim.','ok')}).catch(function(){note(m,'Jika email terdaftar, tautan reset sudah dikirim.','ok')})};

/* produk */
$('cari').oninput=renderProduk;
function renderProduk(){
  var q=$('cari').value.toLowerCase(),box=$('daftarProduk');box.innerHTML='';
  var l=produk.filter(function(p){return p.active!==false&&(p.name||'').toLowerCase().indexOf(q)>=0});
  if(!l.length){box.appendChild(el('p','ph',produk.length?'Produk tidak ditemukan.':'Belum ada produk.'));return}
  l.forEach(function(p){
    var c=el('div','card');
    if(p.img){var i=document.createElement('img');i.src=p.img;i.alt=p.name;i.loading='lazy';c.appendChild(i)}
    var proses=p.status==='proses'||p.concept;c.appendChild(el('span','tag',p.beta===true?'Uji coba beta':(proses?'Dalam pengembangan':(p.cat||'Produk'))));
    c.appendChild(el('h3','',p.name));
    if(p.desc)c.appendChild(el('p','',p.desc));
    var ln=p.beta===true?'':aman(p.link),b;
    if(ln){b=el('a','btn main sm','Buka');b.href=ln;b.target='_blank';b.rel='noopener noreferrer'}
    else{b=el('button','btn main sm',proses?'Segera hadir':'Belum ada tautan');b.disabled=true}
    c.appendChild(b);var dt=el('a','btn sm','Detail & ulasan');dt.href='#p/'+p.id;dt.style.marginLeft='8px';c.appendChild(dt);box.appendChild(c)});
}

/* detail produk & ulasan */
var home=[],sos=[],foot={},FOOT_DEF={nama:'KOPE Technology',slogan:'Innovation for Everyone.',hak:'KOPE Technology'},NAMA={youtube:'YouTube',tiktok:'TikTok',facebook:'Facebook',instagram:'Instagram'};
function renderFooter(){var d=Object.assign({},FOOT_DEF,foot);$('footBrand').textContent=d.nama;$('footSlogan').textContent=d.slogan;$('footCopy').textContent='\u00A9 '+new Date().getFullYear()+' '+d.hak}
function renderSosial(){var b=$('sosialBox');b.innerHTML='';sos.forEach(function(o){var u=aman(o.url);if(!u)return;var a=el('a','btn sm',o.nama||NAMA[o.p]||'Tautan');a.href=u;a.target='_blank';a.rel='noopener noreferrer';b.appendChild(a)});
  var L=$('aListSos');if(L){L.innerHTML='';if(!sos.length)L.appendChild(el('p','ph','Belum ada tautan sosial.'));
    sos.forEach(function(o,k){var r=el('div','item row');r.appendChild(el('div','',(o.nama||NAMA[o.p]||'Tautan')+' \u2014 '+o.url));var d=el('button','btn sm','Hapus');d.onclick=function(){if(confirm('Hapus tautan ini?'))simpanSos(sos.filter(function(_,n){return n!==k}),$('mSos'))};r.appendChild(d);L.appendChild(r)})}}
function simpanSos(arr,m){note(m,'Menyimpan\u2026');db.collection('settings').doc('sosial').set({daftar:arr}).then(function(){note(m,'Tersimpan di server.','ok')}).catch(function(x){note(m,galat(x),'err')})}
function driveId(u){try{var x=new URL(u);if(x.hostname!=='drive.google.com')return null;var m=x.pathname.match(/\/file\/d\/([\w-]+)/),d=m?m[1]:x.searchParams.get('id');return d&&/^[\w-]+$/.test(d)?d:null}catch(e){return null}}
function fotoUrl(u){u=aman(u);var d=u&&driveId(u);return d?'https://lh3.googleusercontent.com/d/'+d:u}
function embed(u){u=aman(u);if(!u)return null;var x=new URL(u),h=x.hostname.replace(/^(www|m)\./,''),id=null,m,P=x.pathname;
  if(h==='youtu.be')id=P.slice(1);
  else if(/(^|\.)youtube\.com$/.test(h)){id=x.searchParams.get('v');m=P.match(/\/(shorts|embed|live)\/([\w-]+)/);if(m)id=m[2]}
  if(id&&/^[\w-]{6,}$/.test(id))return{src:'https://www.youtube-nocookie.com/embed/'+id,r:P.indexOf('/shorts/')===0?'9/16':'16/9'};
  if(h==='vimeo.com'&&(m=P.match(/\/(\d+)/)))return{src:'https://player.vimeo.com/video/'+m[1],r:'16/9'};
  if(h==='tiktok.com'&&(m=P.match(/\/video\/(\d+)/)))return{src:'https://www.tiktok.com/embed/v2/'+m[1],r:'9/16'};
  if(h==='instagram.com'&&(m=P.match(/^\/(?:[\w.]+\/)?(p|reel|tv)\/([\w-]+)/)))return{src:'https://www.instagram.com/'+m[1]+'/'+m[2]+'/embed',r:'9/16'};
  if(h==='facebook.com'||h==='fb.watch')return{src:'https://www.facebook.com/plugins/video.php?show_text=false&href='+encodeURIComponent(u),r:/\/reel\//.test(P)?'9/16':'16/9'};
  var dv=driveId(u);if(dv)return{src:'https://drive.google.com/file/d/'+dv+'/preview',r:'16/9'};
  if(/\.(mp4|webm|ogg)$/i.test(P))return{file:u};return null}
function renderHome(){var B=$('homeFeed');B.innerHTML='';
  home.slice().sort(function(a,b){return byDate(b,a)}).forEach(function(o){var w=el('div');
    if(o.title&&o.type!=='link')w.appendChild(el('h3','',o.title));
    if(o.type==='video'){var e=embed(o.url);
      if(e&&e.src){var f=document.createElement('iframe');f.src=e.src;f.loading='lazy';f.allowFullscreen=true;f.title=o.title||'Video';f.setAttribute('sandbox','allow-scripts allow-same-origin allow-presentation allow-popups');f.style.aspectRatio=e.r;if(e.r==='9/16')f.style.maxWidth='340px';w.appendChild(f)}
      else if(e&&e.file){var v=document.createElement('video');v.src=e.file;v.controls=true;v.playsInline=true;v.preload='metadata';w.appendChild(v)}
      else if(aman(o.url)){var a=el('a','btn main','Tonton video');a.href=aman(o.url);a.target='_blank';a.rel='noopener noreferrer';w.appendChild(a)}else return}
    else if(o.type==='foto'){var src=o.img||fotoUrl(o.url);if(!src)return;var i=document.createElement('img');i.src=src;i.alt=o.title||'Foto';i.loading='lazy';i.referrerPolicy='no-referrer';i.onerror=function(){w.remove()};w.appendChild(i)}
    else if(o.type==='teks'){var t=el('p','',o.text||'');t.style.whiteSpace='pre-line';w.appendChild(t)}
    else if(o.type==='link'&&aman(o.url)){var l=el('a','btn',o.title||'Buka tautan');l.href=aman(o.url);l.target='_blank';l.rel='noopener noreferrer';w.style.textAlign='center';w.appendChild(l)}else return;
    B.appendChild(w)})}
var revId=null,revUn=null,revs=[],pickStar=0;
function bintang(n){var t='';for(var k=1;k<=5;k++)t+=k<=Math.round(n)?'\u2605':'\u2606';return t}
function openDetail(){
  var p=produk.filter(function(x){return x.id===curId})[0],b=$('dInfo');b.innerHTML='';
  if(!p||p.active===false){b.appendChild(el('p','ph',produk.length?'Produk tidak ditemukan.':'Memuat\u2026'));return}
  var g=el('div','dgrid');if(p.img){var i=document.createElement('img');i.src=p.img;i.alt=p.name;g.appendChild(i)}
  var r=el('div'),proses=p.status==='proses'||p.concept;
  r.appendChild(el('span','tag',proses?'Dalam pengembangan':(p.cat||'Produk')));r.appendChild(el('h2','',p.name));
  var sm=el('div','small');sm.id='dStar';r.appendChild(sm);
  r.appendChild(el('p','',p.desc||'Belum ada deskripsi.'));r.lastChild.style.whiteSpace='pre-line';
  var ln=p.beta===true?'':aman(p.link),a;if(ln){a=el('a','btn main','Buka produk');a.href=ln;a.target='_blank';a.rel='noopener noreferrer'}else{a=el('button','btn main',proses?'Segera hadir':'Belum ada tautan');a.disabled=true}
  r.appendChild(a);g.appendChild(r);b.appendChild(g);
  if(revId!==curId){if(revUn)revUn();revs=[];revId=curId;
    revUn=db.collection('products').doc(curId).collection('reviews').onSnapshot(function(s){revs=s.docs.map(function(d){var x=d.data();x.id=d.id;return x}).sort(byDate);renderRev()},function(){$('revSum').textContent='Ulasan belum bisa dimuat.'})}
  renderRev()}
function renderRev(){
  var n=revs.length,avg=n?revs.reduce(function(t,x){return t+x.rating},0)/n:0;
  $('revSum').textContent=n?avg.toFixed(1)+' dari 5 \u00b7 '+n+' ulasan':'Belum ada ulasan.';
  var ds=$('dStar');if(ds){ds.innerHTML='';ds.appendChild(el('span','star',bintang(avg)));ds.appendChild(document.createTextNode(n?' '+avg.toFixed(1)+' ('+n+' ulasan)':' Belum ada ulasan'))}
  var L=$('revList');L.innerHTML='';
  revs.forEach(function(x){var c=el('div','item'),h=el('div');h.appendChild(el('strong','',x.name||'Pengguna'));h.appendChild(document.createTextNode(' '));h.appendChild(el('span','star',bintang(x.rating)));c.appendChild(h);
    c.appendChild(el('div','small',tgl(x.createdAt)));if(x.text){var t=el('div','',x.text);t.style.whiteSpace='pre-line';c.appendChild(t)}
    if(user&&(x.uid===user.uid||isAdmin)){var d=el('button','btn sm','Hapus');d.style.marginTop='6px';d.onclick=function(){if(confirm('Hapus ulasan ini?'))db.collection('products').doc(curId).collection('reviews').doc(x.id).delete()};c.appendChild(d)}
    L.appendChild(c)});
  var F=$('revForm');F.innerHTML='';
  if(!user){var q=el('p','small','Masuk untuk menulis ulasan. ');var l=el('a','','Masuk');l.href='#masuk';l.style.textDecoration='underline';q.appendChild(l);F.appendChild(q);return}
  var mine=revs.filter(function(x){return x.uid===user.uid})[0];if(!pickStar||pickStar.cid!==curId)pickStar={v:mine?mine.rating:0,cid:curId};
  F.appendChild(el('strong','',mine?'Ubah ulasan kamu':'Tulis ulasan'));
  var row=el('div');row.style.margin='8px 0';
  for(var k=1;k<=5;k++)(function(k){var bt=el('button','sbtn'+(k<=pickStar.v?' on':''),'\u2605');bt.type='button';bt.setAttribute('aria-label',k+' bintang');bt.onclick=function(){pickStar.v=k;renderRev()};row.appendChild(bt)})(k);
  F.appendChild(row);var ta=document.createElement('textarea');ta.rows=3;ta.maxLength=500;ta.placeholder='Ceritakan pengalamanmu (boleh kosong)';ta.value=mine?mine.text||'':'';F.appendChild(ta);
  var sv=el('button','btn main sm','Kirim ulasan');sv.style.marginTop='10px';var m=el('div');m.setAttribute('role','status');
  sv.onclick=function(){if(!user.emailVerified){note(m,'Verifikasi email Anda dulu (cek kotak masuk), lalu muat ulang halaman.','err');return}if(!pickStar.v){note(m,'Pilih bintang 1-5 dulu.','err');return}note(m,'Menyimpan\u2026');
    var nm=(user.displayName||(user.email||'').split('@')[0]||'Pengguna').slice(0,60);
    db.collection('products').doc(curId).collection('reviews').doc(user.uid).set({uid:user.uid,name:nm,rating:pickStar.v,text:ta.value.trim(),createdAt:mine?mine.createdAt:firebase.firestore.FieldValue.serverTimestamp()})
    .then(function(){note(m,'Terima kasih, ulasan tersimpan.','ok')}).catch(function(x){note(m,galat(x),'err')})};
  F.appendChild(sv);F.appendChild(m)}

/* permintaan layanan */
$('fLayanan').onsubmit=function(e){e.preventDefault();var f=e.target,m=$('mLayanan');
  if(!user){note(m,'Masuk dulu untuk mengirim permintaan.','err');location.hash='#masuk';return}
  if(!user.emailVerified){note(m,'Verifikasi email Anda dulu (cek kotak masuk), lalu muat ulang halaman.','err');return}
  if(f.service.selectedOptions[0].disabled){note(m,'Layanan ini masih segera hadir. Pilih Website.','err');return}
  var pesan='Halo KOPE Technology, saya ingin meminta layanan.\nNama: '+f.name.value+'\nEmail: '+f.email.value+'\nJenis layanan: '+f.service.value+'\nPerkiraan anggaran: '+(f.budget.value||'-')+'\nCeritakan proyek: '+f.desc.value;
  note(m,'Mengirim…');
  db.collection('requests').add({uid:user.uid,name:f.name.value,email:f.email.value,service:f.service.value,budget:f.budget.value,desc:f.desc.value,status:'Baru',createdAt:firebase.firestore.FieldValue.serverTimestamp()})
  .then(function(){f.desc.value='';f.budget.value='';note(m,'Pesan terkirim. Kami akan menghubungi kamu lewat email.','ok');
    var wa=(co.wa||'').replace(/\D/g,'');if(wa){m.appendChild(document.createElement('br'));var a=el('a','btn main sm','Chat admin lewat WhatsApp');a.href='https://wa.me/'+wa+'?text='+encodeURIComponent(pesan);a.target='_blank';a.rel='noopener noreferrer';a.style.marginTop='8px';m.appendChild(a)}})
  .catch(function(x){note(m,galat(x),'err')})};

/* pesanan & permintaan saya */
function tgl(t){return t&&t.toDate?t.toDate().toLocaleString('id-ID',{timeZone:'Asia/Jakarta'}):''}
function byDate(a,b){return (b.createdAt?b.createdAt.seconds:9e9)-(a.createdAt?a.createdAt.seconds:9e9)}
function fill(box,snap,draw,kosong){box.innerHTML='';var l=snap.docs.map(function(d){var x=d.data();x.id=d.id;return x}).sort(byDate);
  if(!l.length){box.appendChild(el('p','ph',kosong));return}l.forEach(function(x){box.appendChild(draw(x))})}
function loadMine(){
  db.collection('requests').where('uid','==',user.uid).get().then(function(s){fill($('listReq'),s,function(o){
    var c=el('div','item row');var d=el('div');d.appendChild(el('strong','',o.service));d.appendChild(el('div','small',tgl(o.createdAt)+' · Status: '+o.status));c.appendChild(d);
    var b=el('button','btn sm','Hapus');b.onclick=function(){if(confirm('Hapus permintaan ini?'))db.collection('requests').doc(o.id).delete().then(loadMine)};c.appendChild(b);return c},'Belum ada permintaan.')}).catch(function(){$('listReq').textContent='Tidak bisa memuat.'});
}
$('hapusAkun').onclick=function(){if(!user)return;
  var t=Date.parse(user.metadata&&user.metadata.lastSignInTime||'');
  if(!t||Date.now()-t>300000){alert('Demi keamanan, keluar lalu masuk lagi, kemudian segera tekan hapus akun.');return}
  if(!confirm('Hapus akun dan semua data Anda (permintaan, ulasan, dan uji coba beta)? Tindakan ini tidak bisa dibatalkan.'))return;
  var uid=user.uid;
  db.collection('requests').where('uid','==',uid).get()
  .then(function(s){return Promise.all(s.docs.map(function(d){return d.ref.delete()}))})
  .then(function(){var b=db.batch();b.delete(db.collection('beta_requests').doc(uid));b.delete(db.collection('beta_selfies').doc(uid));return b.commit()})
  .then(function(){return Promise.all(produk.map(function(p){return db.collection('products').doc(p.id).collection('reviews').doc(uid).delete()}))})
  .then(function(){return user.delete()})
  .then(function(){alert('Akun dan data Anda sudah dihapus.');location.hash='#beranda'})
  .catch(function(){alert('Gagal. Keluar, masuk lagi, lalu coba hapus akun kembali.')})};
/* admin */
document.querySelectorAll('.tabs .btn').forEach(function(b){b.onclick=function(){
  document.querySelectorAll('.tabs .btn').forEach(function(x){x.classList.toggle('on',x===b)});
  document.querySelectorAll('.at').forEach(function(a){a.hidden=a.id!==b.dataset.t})}});
function statusSel(list,cur,fn){var s=document.createElement('select');s.style.width='auto';list.forEach(function(v){var o=el('option','',v);o.value=v;if(v===cur)o.selected=true;s.appendChild(o)});s.onchange=function(){fn(s.value)};return s}
$('bBackup').onclick=function(){var m=$('mBackup');note(m,'Menyiapkan cadangan\u2026');
  var names=['products','requests','subs','settings','home','beta_requests','beta_links'];
  function rapi(s){return s.docs.map(function(d){var x=d.data();x.id=d.id;Object.keys(x).forEach(function(k){if(x[k]&&x[k].toDate)x[k]=x[k].toDate().toISOString()});return x})}
  Promise.all(names.map(function(n){return db.collection(n).get().then(rapi)})).then(function(r){
    var out={dibuat:new Date().toISOString(),versi:2};names.forEach(function(n,i){out[n]=r[i]});
    return Promise.all(r[0].map(function(p){return db.collection('products').doc(p.id).collection('reviews').get().then(function(s){return{produk:p.id,ulasan:rapi(s)}})})).then(function(rv){out.reviews=rv;return out})})
  .then(function(out){var b=new Blob([JSON.stringify(out,null,1)],{type:'application/json'});
    var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='cadangan-kope-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();note(m,'Cadangan lengkap sudah diunduh.','ok')})
  .catch(function(){note(m,'Gagal membuat cadangan.','err')})};
function loadHome(){var L=$('aListHome');L.innerHTML='';if(!home.length)L.appendChild(el('p','ph','Belum ada konten beranda.'));
  home.slice().sort(function(a,b){return byDate(b,a)}).forEach(function(o){var r=el('div','item row');r.appendChild(el('div','',o.type.toUpperCase()+' \u2014 '+(o.title||o.text||o.url||'(foto)').slice(0,70)));
    var d=el('button','btn sm','Hapus');d.onclick=function(){if(confirm('Hapus dari beranda?'))db.collection('home').doc(o.id).delete()};r.appendChild(d);L.appendChild(r)})}
function tglIso(d){return d.toISOString().slice(0,10)}
function loadSubs(){db.collection('subs').orderBy('due').get().then(function(s){var L=$('aListSub');L.innerHTML='';if(s.empty){L.appendChild(el('p','ph','Belum ada langganan.'));return}
  s.docs.forEach(function(d){var o=d.data(),ms=Date.now()-Date.parse(o.due+'T23:59:59+07:00'),st,bad=false;
    if(ms<=0)st='Aktif, sisa '+Math.ceil(-ms/864e5)+' hari';else if(ms/864e5<=10){st='DITANGGUHKAN, '+Math.ceil(10-ms/864e5)+' hari lagi sebelum dihapus';bad=true}else{st='LEWAT 10 HARI: saatnya dihapus';bad=true}
    var r=el('div','item row'),i=el('div');i.appendChild(el('strong','',o.cust+' ('+(o.plan==='tahun'?'tahunan':'bulanan')+')'));i.appendChild(el('div','small',(o.site||'-')+' \u00b7 jatuh tempo '+o.due));var sp=el('div','',st);if(bad)sp.style.color='var(--bad)';i.appendChild(sp);r.appendChild(i);
    var w=el('div','row'),pj=el('button','btn sm','Perpanjang');pj.onclick=function(){var t=new Date(o.due+'T00:00:00Z');if(o.plan==='tahun')t.setUTCFullYear(t.getUTCFullYear()+1);else t.setUTCMonth(t.getUTCMonth()+1);d.ref.update({due:tglIso(t)}).then(loadSubs)};
    var h=el('button','btn sm','Hapus');h.onclick=function(){if(confirm('Hapus catatan ini?'))d.ref.delete().then(loadSubs)};w.appendChild(pj);w.appendChild(h);r.appendChild(w);L.appendChild(r)})}).catch(function(){$('aListSub').textContent='Tidak bisa memuat.'})}
function loadAdmin(){loadHome();loadSubs();fillIsi();loadBetaAdmin();loadAc();var ff=$('fFoot');if(document.activeElement!==ff.nama){var d=Object.assign({},FOOT_DEF,foot);ff.nama.value=d.nama;ff.slogan.value=d.slogan;ff.hak.value=d.hak}
  var fv=$('fVer');if(document.activeElement!==fv.domain){fv.domain.value=verData.domain||location.hostname;fv.aktif.checked=verData.aktif===true;fv.url.value=verData.url||'https://kopedigitaltechnology.my.id/';fv.pesan.value=verData.pesan||'Situs ini tidak terverifikasi sebagai situs resmi KOPE Technology, jadi data tidak ditampilkan.'}
  var fc=$('fCo');['nama','alamat','email','telepon','wa','jam','maps','hargaBulan','hargaTahun'].forEach(function(k){if(document.activeElement!==fc[k])fc[k].value=co[k]||''});
  $('sAuth').textContent=user?'Aktif (email dan Google)':'Belum masuk';
  $('sHttps').textContent=location.protocol==='https:'?'Aktif':'Belum aktif. Buka lewat alamat https://';
  var L=$('aListProduk');L.innerHTML='';
  produk.forEach(function(p){var r=el('div','item row');r.appendChild(el('div','',p.name+(p.beta===true?' (uji coba beta)':'')+(p.link?' — ada link':' — belum ada link')+(p.active===false?' (disembunyikan)':'')));
    var w=el('div','row');
    var t=el('button','btn sm',p.active===false?'Tampilkan':'Sembunyikan');t.onclick=function(){db.collection('products').doc(p.id).update({active:p.active===false})};
    var d=el('button','btn sm','Hapus');d.onclick=function(){if(confirm('Hapus produk ini?'))db.collection('products').doc(p.id).delete()};
    var st=statusSel(['Tersedia','Dalam pengembangan'],(p.status==='proses'||p.concept)?'Dalam pengembangan':'Tersedia',function(v){db.collection('products').doc(p.id).update({status:v==='Tersedia'?'siap':'proses',concept:false})});
    var lk=el('button','btn sm',p.link?'Ubah link':'Pasang link');
    lk.onclick=function(){var u=prompt('Tempel tautan produk (https://...). Kosongkan untuk menghapus.',p.link||'');if(u===null)return;u=u.trim();var a=u?aman(u):'';if(u&&!a){alert('Tautan harus diawali https://');return}db.collection('products').doc(p.id).update({link:a})};
    w.appendChild(st);w.appendChild(lk);betaTombol(p,w);w.appendChild(t);w.appendChild(d);r.appendChild(w);L.appendChild(r)});
  db.collection('requests').orderBy('createdAt','desc').limit(100).get().then(function(s){fill($('aListReq'),s,function(o){
    var c=el('div','item');c.appendChild(el('strong','',o.service+' — '+o.name));
    c.appendChild(el('div','small',tgl(o.createdAt)+' · '+o.email+(o.budget?' · Anggaran: '+o.budget:'')));
    c.appendChild(el('div','',o.desc));
    c.appendChild(statusSel(['Baru','Dihubungi','Berjalan','Selesai','Ditutup'],o.status,function(v){db.collection('requests').doc(o.id).update({status:v})}));return c},'Belum ada permintaan.')}).catch(function(){$('aListReq').textContent='Tidak bisa memuat.'});
}
function kecilkan(file,mx){return new Promise(function(ok,gagal){
  var r=new FileReader();r.onerror=gagal;
  r.onload=function(){var im=new Image();im.onerror=gagal;
    im.onload=function(){var s=Math.min(1,(mx||640)/Math.max(im.width,im.height)),c=document.createElement('canvas');
      c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);
      ok(c.toDataURL('image/jpeg',0.75))};
    im.src=r.result};
  r.readAsDataURL(file)})}
$('fProduk').onsubmit=function(e){e.preventDefault();var f=e.target,m=$('mProduk');note(m,'Menyimpan…');
  var file=f.img.files[0];
  (file?kecilkan(file):Promise.resolve('')).then(function(img){
    if(img.length>700000)throw new Error('besar');var ln0=f.link.value.trim();if(ln0&&!aman(ln0))throw new Error('link');
    return db.collection('products').add({name:f.name.value.trim(),cat:f.cat.value,img:img,desc:f.desc.value.trim(),status:f.status.value,link:aman(f.link.value.trim()),concept:false,active:true,createdAt:firebase.firestore.FieldValue.serverTimestamp()})})
  .then(function(){f.reset();note(m,'Produk ditambahkan.','ok');loadAdmin()})
  .catch(function(x){note(m,x&&x.message==='besar'?'Foto terlalu besar. Pilih foto lain.':(x&&x.message==='link'?'Tautan harus diawali https://':galat(x)),'err')})};
$('fHome').onsubmit=function(e){e.preventDefault();var f=e.target,m=$('mHome'),t=f.type.value,u=f.url.value.trim(),ti=f.title.value.trim(),tx=f.text.value.trim(),file=f.img.files[0];
  if(u&&!aman(u)){note(m,'URL harus diawali https://','err');return}
  var bad=(t==='video'&&!u)?'Isi URL video.':(t==='link'&&(!u||!ti))?'Tautan butuh judul dan URL.':(t==='teks'&&!tx)?'Isi tulisannya.':(t==='foto'&&!u&&!file)?'Isi URL foto atau unggah foto.':'';
  if(bad){note(m,bad,'err');return}note(m,'Menyimpan\u2026');
  (t==='foto'&&file?kecilkan(file,1000):Promise.resolve('')).then(function(img){if(img.length>700000)throw new Error('besar');
    return db.collection('home').add({type:t,title:ti,url:aman(u),img:img,text:tx,createdAt:firebase.firestore.FieldValue.serverTimestamp()})})
  .then(function(){f.reset();note(m,'Ditambahkan ke beranda.','ok')}).catch(function(x){note(m,x&&x.message==='besar'?'Foto terlalu besar. Pilih foto lain.':galat(x),'err')})};
$('fSub').onsubmit=function(e){e.preventDefault();var f=e.target,m=$('mSub');note(m,'Menyimpan\u2026');
  db.collection('subs').add({cust:f.cust.value.trim(),site:f.site.value.trim(),plan:f.plan.value,due:f.due.value,createdAt:firebase.firestore.FieldValue.serverTimestamp()})
  .then(function(){f.reset();note(m,'Tersimpan.','ok');loadSubs()}).catch(function(x){note(m,galat(x),'err')})};
$('fVer').onsubmit=function(e){e.preventDefault();var f=e.target,m=$('mVer'),dm=f.domain.value.trim().toLowerCase();
  if(!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(dm)){note(m,'Tulis domain saja, contoh: kopedigitaltechnology.my.id','err');return}var u=f.url.value.trim();if(u&&!aman(u)){note(m,'Alamat situs harus diawali https://','err');return}note(m,'Menyimpan\u2026');var dv={domain:dm,aktif:f.aktif.checked,url:u,pesan:f.pesan.value.trim()};
  db.collection('settings').doc('verifikasi').set(dv).then(function(){verData=dv;note(m,'Tersimpan. Segarkan halaman untuk melihat hasilnya.','ok')}).catch(function(x){note(m,galat(x),'err')})};
$('fFoot').onsubmit=function(e){e.preventDefault();var f=e.target,m=$('mFoot');note(m,'Menyimpan\u2026');
  db.collection('settings').doc('footer').set({nama:f.nama.value.trim()||FOOT_DEF.nama,slogan:f.slogan.value.trim(),hak:f.hak.value.trim()||FOOT_DEF.hak}).then(function(){note(m,'Tersimpan di server.','ok')}).catch(function(x){note(m,galat(x),'err')})};
$('fSos').onsubmit=function(e){e.preventDefault();var f=e.target,m=$('mSos'),u=aman(f.url.value.trim());
  if(!u){note(m,'URL harus diawali https://','err');return}if(f.p.value==='lain'&&!f.nama.value.trim()){note(m,'Isi nama tombol.','err');return}
  simpanSos(sos.concat([{p:f.p.value,nama:f.nama.value.trim(),url:u}]),m);f.reset()};
$('fCo').onsubmit=function(e){e.preventDefault();var f=e.target,m=$('mCo'),mp=f.maps.value.trim();
  if(mp&&!aman(mp)){note(m,'Tautan Maps harus diawali https://','err');return}
  var d={};['nama','alamat','email','telepon','wa','jam'].forEach(function(k){d[k]=f[k].value.trim()});d.maps=mp;d.hargaBulan=Number(f.hargaBulan.value)||0;d.hargaTahun=Number(f.hargaTahun.value)||0;note(m,'Menyimpan\u2026');
  db.collection('settings').doc('company').set(d).then(function(){note(m,'Tersimpan di server.','ok')}).catch(function(x){note(m,galat(x),'err')})};
function renderCerita(){var b=$('ceritaBox');b.innerHTML='';var t=String(cerita.isi||'').trim();if(!t){b.hidden=true;return}
  b.hidden=false;if(cerita.judul)b.appendChild(el('h3','',String(cerita.judul)));
  t.split(/\n\s*\n/).forEach(function(p){p=p.trim();if(p)b.appendChild(el('p','',p))})}
function renderBeranda(){var A=$('angkaBox'),P=$('poinBox'),W=$('berandaBox');A.innerHTML='';P.innerHTML='';
  (Array.isArray(beranda.angka)?beranda.angka:[]).forEach(function(a){if(!a||!a.n)return;var c=el('div','stat');c.appendChild(el('b','',String(a.n)));c.appendChild(el('span','',String(a.l||'')));A.appendChild(c)});
  (Array.isArray(beranda.poin)?beranda.poin:[]).forEach(function(p){if(!p||!p.j)return;var c=el('div','card');c.appendChild(el('h3','',String(p.j)));c.appendChild(el('p','',String(p.t||'')));P.appendChild(c)});
  W.hidden=!(A.children.length||P.children.length)}
function fillIsi(){var fc=$('fCerita'),fb=$('fBeranda');
  if(!fc.contains(document.activeElement)){fc.judul.value=cerita.judul||'';fc.isi.value=cerita.isi||''}
  if(!fb.contains(document.activeElement)){var P=Array.isArray(beranda.poin)?beranda.poin:[],A=Array.isArray(beranda.angka)?beranda.angka:[],i;
    for(i=0;i<3;i++){fb['pj'+(i+1)].value=(P[i]&&P[i].j)||'';fb['pt'+(i+1)].value=(P[i]&&P[i].t)||''}
    for(i=0;i<4;i++){fb['an'+(i+1)].value=(A[i]&&A[i].n)||'';fb['al'+(i+1)].value=(A[i]&&A[i].l)||''}}}
$('fCerita').onsubmit=function(e){e.preventDefault();var f=e.target,m=$('mCerita');note(m,'Menyimpan\u2026');
  db.collection('settings').doc('cerita').set({judul:f.judul.value.trim(),isi:f.isi.value.trim()}).then(function(){note(m,'Tersimpan di server.','ok')}).catch(function(x){note(m,galat(x),'err')})};
$('fBeranda').onsubmit=function(e){e.preventDefault();var f=e.target,m=$('mBeranda'),poin=[],angka=[],i;
  for(i=1;i<=3;i++){var j=f['pj'+i].value.trim();if(j)poin.push({j:j,t:f['pt'+i].value.trim()})}
  for(i=1;i<=4;i++){var n=f['an'+i].value.trim();if(n)angka.push({n:n,l:f['al'+i].value.trim()})}
  note(m,'Menyimpan\u2026');
  db.collection('settings').doc('beranda').set({poin:poin,angka:angka}).then(function(){note(m,'Tersimpan di server.','ok')}).catch(function(x){note(m,galat(x),'err')})};
document.addEventListener('contextmenu',function(e){if(e.target.closest('img,.nocopy'))e.preventDefault()});
document.addEventListener('dragstart',function(e){if(e.target.tagName==='IMG')e.preventDefault()});
document.querySelectorAll('.nocopy').forEach(function(n){n.addEventListener('copy',function(e){e.preventDefault()})});
route();

/* ============ UJI COBA BETA ============ */
var betaBusy=false,betaLast=0,betaImg='',betaOk=false,betaLinks={},ovAuto=false,ovFokus=null,STB={menunggu:'Menunggu persetujuan',disetujui:'Disetujui',ditolak:'Ditolak'};
function adaGoogle(){return !!user&&(user.providerData||[]).some(function(p){return p&&p.providerId==='google.com'})}
/* overlay masuk Google */
function bukaOv(){$('mOv').textContent='';$('mOv').className='';ovFokus=document.activeElement;$('ovLogin').hidden=false;document.body.style.overflow='hidden';$('ovGoogle').focus()}
function tutupOv(){$('ovLogin').hidden=true;document.body.style.overflow='';if(ovFokus&&ovFokus.focus)ovFokus.focus()}
$('ovTutup').onclick=tutupOv;
$('ovLogin').onclick=function(e){if(e.target===this)tutupOv()};
document.addEventListener('keydown',function(e){if($('ovLogin').hidden)return;
  if(e.key==='Escape'){tutupOv();return}
  if(e.key==='Tab'){var a=$('ovGoogle'),b=$('ovTutup');if(e.shiftKey&&document.activeElement===a){e.preventDefault();b.focus()}else if(!e.shiftKey&&document.activeElement===b){e.preventDefault();a.focus()}}});
$('ovGoogle').onclick=function(){var m=$('mOv');if(!auth){note(m,'Layanan belum siap.','err');return}note(m,'Membuka Google\u2026');
  auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).then(function(){tutupOv()})
  .catch(function(x){var c=x&&x.code||'';note(m,c==='auth/popup-blocked'?'Pop-up diblokir browser. Izinkan pop-up lalu coba lagi.':c.indexOf('account-exists')>=0?'Gmail ini sudah dipakai untuk akun email dan kata sandi. Hubungi admin.':c==='auth/popup-closed-by-user'||c==='auth/cancelled-popup-request'?'Masuk dibatalkan.':'Masuk dengan Google gagal. Coba lagi.','err')})};
$('bGate').onclick=bukaOv;
/* Foto diperkecil dan dikodekan ulang jadi JPEG (membuang data lokasi/EXIF), hasilnya base64 tanpa awalan */
function selfieKecil(file){return new Promise(function(ok,gagal){
  if(!file||!/^image\//.test(file.type)){gagal(new Error('tipe'));return}
  if(file.size>10*1024*1024){gagal(new Error('besar'));return}
  var r=new FileReader();r.onerror=function(){gagal(new Error('tipe'))};
  r.onload=function(){var im=new Image();im.onerror=function(){gagal(new Error('tipe'))};
    im.onload=function(){var s=Math.min(1,640/Math.max(im.width,im.height)),c=document.createElement('canvas');
      c.width=Math.max(1,Math.round(im.width*s));c.height=Math.max(1,Math.round(im.height*s));
      c.getContext('2d').drawImage(im,0,0,c.width,c.height);
      var q=0.72,d=c.toDataURL('image/jpeg',q);
      while(d.length>230000&&q>0.35){q-=0.1;d=c.toDataURL('image/jpeg',q)}
      if(d.indexOf('data:image/jpeg;base64,')!==0||d.length>245000){gagal(new Error('besar'));return}
      ok(d.slice(23))};
    im.src=r.result};
  r.readAsDataURL(file)})}
function betaGalat(x){var c=x&&x.code||'';
  if(c.indexOf('too-many')>=0)return 'Terlalu banyak percobaan. Coba lagi nanti.';
  if(c.indexOf('permission')>=0)return 'Ditolak server. Pastikan Anda masuk dengan Google (Gmail) dan belum pernah mendaftar. Jika terus gagal, hubungi admin.';
  return 'Gagal mengirim. Periksa koneksi lalu coba lagi.'}
$('betaFoto').onchange=function(){var inp=this,f=inp.files[0],m=$('mBeta'),p=$('betaPrev');betaImg='';p.hidden=true;if(!f)return;
  note(m,'Memproses foto\u2026');
  selfieKecil(f).then(function(b){betaImg=b;p.src='data:image/jpeg;base64,'+b;p.hidden=false;note(m,'')})
  .catch(function(x){inp.value='';note(m,x&&x.message==='besar'?'Foto terlalu besar. Pilih foto lain.':'Foto tidak bisa dibaca. Pakai foto JPG atau PNG.','err')})};
$('betaSetuju').onchange=function(){$('bBeta').disabled=!this.checked||betaBusy};
$('fBeta').onsubmit=function(e){e.preventDefault();var f=e.target,m=$('mBeta');
  if(!auth||!db){note(m,'Layanan belum siap. Coba lagi nanti.','err');return}
  if(f.website.value){note(m,'Permintaan terkirim.','ok');return}
  if(!adaGoogle()){bukaOv();return}
  if(betaBusy)return;
  if(Date.now()-betaLast<30000){note(m,'Tunggu sebentar sebelum mengirim lagi.','err');return}
  var nama=f.nama.value.trim(),hp=f.hp.value.replace(/[\s().-]/g,''),em=(user.email||'').trim().toLowerCase(),al=f.alamat.value.trim();
  if(nama.length<2||nama.length>80){note(m,'Isi nama lengkap Anda.','err');return}
  if(!/^\+?[0-9]{9,15}$/.test(hp)){note(m,'Nomor HP tidak valid. Pakai angka saja, contoh 08123456789.','err');return}
  if(!/^[a-z0-9._%+-]+@gmail\.com$/.test(em)){note(m,'Uji coba beta hanya untuk akun Gmail (nama@gmail.com).','err');return}
  if(!f.gender.value){note(m,'Pilih jenis kelamin.','err');return}
  if(!betaImg){note(m,'Unggah foto selfie dulu.','err');return}
  if(!$('betaSetuju').checked){note(m,'Centang persetujuan kebijakan privasi dulu.','err');return}
  betaBusy=true;$('bBeta').disabled=true;note(m,'Mengirim\u2026');
  user.reload().catch(function(){}).then(function(){return user.getIdToken(true)})
  .then(function(){var u=user,ts=firebase.firestore.FieldValue.serverTimestamp(),b=db.batch();
    var r={uid:u.uid,name:nama,phone:hp,email:u.email,gender:f.gender.value,consent:true,status:'menunggu',hasSelfie:true,emailVerified:u.emailVerified===true,createdAt:ts};
    if(al)r.address=al;
    b.set(db.collection('beta_selfies').doc(u.uid),{uid:u.uid,img:betaImg,mime:'image/jpeg',createdAt:ts});
    b.set(db.collection('beta_requests').doc(u.uid),r);
    return b.commit()})
  .then(function(){betaLast=Date.now();betaImg='';f.reset();$('betaPrev').hidden=true;note(m,'');betaBusy=false;loadBeta()})
  .catch(function(x){betaBusy=false;$('bBeta').disabled=!$('betaSetuju').checked;note(m,betaGalat(x),'err')})};
function betaHapus(uid,sesudah){var b=db.batch();b.delete(db.collection('beta_requests').doc(uid));b.delete(db.collection('beta_selfies').doc(uid));return b.commit().then(sesudah)}
function loadBeta(){if(!db||betaBusy)return;
  var st=$('betaStatus'),fm=$('fBeta'),gt=$('betaGate');betaOk=false;
  if(!adaGoogle()){st.hidden=true;fm.hidden=true;gt.hidden=false;betaLinks={};
    $('betaGateTeks').textContent=user?'Uji coba beta hanya untuk akun Google. Keluar dari akun ini, lalu masuk dengan Google.':'Masuk dengan akun Google dulu untuk mendaftar uji coba beta.';
    renderBetaApps();if(!user&&!ovAuto){ovAuto=true;bukaOv()}return}
  gt.hidden=true;fm.gmail.value=user.email||'';if(!fm.nama.value)fm.nama.value=user.displayName||'';
  db.collection('beta_requests').doc(user.uid).get().then(function(d){
    if(!d.exists){st.hidden=true;fm.hidden=false;renderBetaApps();return}
    var o=d.data();betaOk=o.status==='disetujui';fm.hidden=true;st.hidden=false;betaStatus(o,st);renderBetaApps()})
  .catch(function(){st.hidden=true;fm.hidden=false;renderBetaApps()})}
function betaStatus(o,box){box.innerHTML='';box.appendChild(el('h3','','Status uji coba beta'));
  box.appendChild(el('span','chip '+(o.status==='disetujui'?'yes':o.status==='ditolak'?'no':''),STB[o.status]||o.status));
  box.appendChild(el('p','small','Atas nama '+o.name+' \u00b7 dikirim '+tgl(o.createdAt)));
  if(user&&!user.emailVerified){var v=el('p','small','Email Anda belum diverifikasi. Buka kotak masuk Gmail, tekan tautan dari Firebase, lalu muat ulang halaman ini. ');
    var vb=el('button','btn sm','Kirim ulang email');vb.type='button';vb.onclick=function(){user.sendEmailVerification().then(function(){alert('Email verifikasi dikirim.')}).catch(function(){alert('Coba lagi beberapa menit lagi.')})};v.appendChild(vb);box.appendChild(v)}
  if(o.status==='menunggu')box.appendChild(el('p','','Permintaan Anda sedang diperiksa admin. Cek lagi nanti di halaman ini.'));
  if(o.status==='ditolak')box.appendChild(el('p','','Permintaan ini belum bisa kami setujui. Anda bisa menghapusnya lalu mendaftar lagi dengan data yang benar.'));
  if(o.status==='disetujui')box.appendChild(el('p','','Permintaan Anda disetujui. Tombol uji coba ada pada kartu aplikasi di bawah.'));
  var h=el('button','btn sm','Hapus permintaan saya');h.type='button';h.style.marginTop='14px';
  h.onclick=function(){if(confirm('Hapus permintaan uji coba Anda? Foto selfie ikut terhapus dari server.'))betaHapus(user.uid,loadBeta).catch(function(){alert('Gagal menghapus. Coba lagi.')})};box.appendChild(h)}
/* daftar aplikasi yang sedang uji coba (produk bertanda beta). Tautan hanya dimuat untuk peserta yang disetujui. */
function renderBetaApps(){var b=$('betaApps');if(!b)return;b.innerHTML='';
  var l=produk.filter(function(p){return p.beta===true&&p.active!==false});
  if(!l.length){b.appendChild(el('p','ph','Belum ada aplikasi yang dibuka untuk uji coba.'));return}
  l.forEach(function(p){var c=el('div','card');
    if(p.img){var i=document.createElement('img');i.src=p.img;i.alt=p.name;i.loading='lazy';c.appendChild(i)}
    c.appendChild(el('span','tag','Uji coba beta'));c.appendChild(el('h3','',p.name));if(p.desc)c.appendChild(el('p','',p.desc));
    var u=betaOk?aman((betaLinks[p.id]||{}).link||''):'';
    if(u){var a=el('a','btn main sm','Buka uji coba');a.href=u;a.target='_blank';a.rel='noopener noreferrer';c.appendChild(a)}
    else c.appendChild(el('p','small',betaOk?'Tautan belum tersedia, cek lagi nanti.':'Tombol uji coba muncul setelah permintaan Anda disetujui admin.'));
    b.appendChild(c)});
  betaAmbil()}
function betaAmbil(){if(!betaOk||!db)return;var perlu=produk.filter(function(p){return p.beta===true&&!(p.id in betaLinks)});if(!perlu.length)return;
  Promise.all(perlu.map(function(p){return db.collection('beta_links').doc(p.id).get().then(function(d){betaLinks[p.id]=d.exists?d.data():{}}).catch(function(){betaLinks[p.id]={}})})).then(renderBetaApps)}

/* --- admin: pendaftar uji coba --- */
function betaPutus(o,st){if(!confirm((st==='disetujui'?'Terima':'Tolak')+' '+o.name+'? Foto selfie akan dihapus permanen dari server.'))return;
  var b=db.batch();b.update(db.collection('beta_requests').doc(o.id),{status:st,hasSelfie:false,decidedAt:firebase.firestore.FieldValue.serverTimestamp()});
  b.delete(db.collection('beta_selfies').doc(o.id));b.commit().then(loadBetaAdmin).catch(function(){alert('Gagal. Coba lagi.')})}
function drawBeta(o){var c=el('div','item'),t=el('div','row'),h=el('div');h.appendChild(el('strong','',o.name));
  h.appendChild(el('div','small',tgl(o.createdAt)+' \u00b7 '+(STB[o.status]||o.status)));t.appendChild(h);c.appendChild(t);
  var d=el('div','det');
  [['Gmail',o.email+(o.emailVerified?' (terverifikasi)':' (belum verifikasi)')],['Nomor HP',o.phone],['Jenis kelamin',o.gender],['Alamat',o.address||'-']].forEach(function(k){var p=el('div','small');p.appendChild(el('strong','',k[0]+': '));p.appendChild(document.createTextNode(k[1]));d.appendChild(p)});
  c.appendChild(d);
  var box=el('div');c.appendChild(box);var a=el('div','acts');
  if(o.hasSelfie){var sb=el('button','btn sm','Lihat selfie');sb.type='button';sb.onclick=function(){sb.disabled=true;
    db.collection('beta_selfies').doc(o.id).get().then(function(s){sb.disabled=false;box.innerHTML='';
      if(!s.exists||typeof s.data().img!=='string'){box.appendChild(el('p','small','Foto tidak ada.'));return}
      var im=new Image();im.alt='Selfie verifikasi '+o.name;im.className='selfie';im.src='data:image/jpeg;base64,'+s.data().img;box.appendChild(im)}).catch(function(){sb.disabled=false;box.textContent='Tidak bisa memuat foto.'})};a.appendChild(sb)}
  if(o.status!=='disetujui'){var ok=el('button','btn sm main','Terima');ok.type='button';ok.onclick=function(){betaPutus(o,'disetujui')};a.appendChild(ok)}
  if(o.status!=='ditolak'){var no=el('button','btn sm','Tolak');no.type='button';no.onclick=function(){betaPutus(o,'ditolak')};a.appendChild(no)}
  var hp=el('button','btn sm','Hapus');hp.type='button';hp.onclick=function(){if(confirm('Hapus permintaan ini beserta foto selfie-nya?'))betaHapus(o.id,loadBetaAdmin).catch(function(){alert('Gagal. Coba lagi.')})};a.appendChild(hp);
  c.appendChild(a);return c}
function loadBetaAdmin(){var L=$('aListBeta');if(!L||!db||!isAdmin)return;
  db.collection('beta_requests').orderBy('createdAt','desc').limit(100).get().then(function(s){fill(L,s,drawBeta,'Belum ada pendaftar uji coba.')}).catch(function(){L.textContent='Tidak bisa memuat.'})}
/* --- admin: tombol di tab Produk (jadikan beta, ubah link beta, rilis penuh) --- */
function betaTombol(p,w){var TS=function(){return firebase.firestore.FieldValue.serverTimestamp()},gagal=function(){alert('Gagal. Coba lagi.')};
  if(p.beta!==true){var b=el('button','btn sm','Jadikan uji coba beta');b.type='button';
    b.onclick=function(){var u=prompt('Tempel tautan uji coba beta (https://...). Hanya peserta yang disetujui bisa melihatnya. Tautan publik produk disembunyikan selama uji coba.','');if(u===null)return;var a=aman(u.trim());if(!a){alert('Tautan harus diawali https://');return}
      var bt=db.batch();bt.set(db.collection('beta_links').doc(p.id),{link:a,info:'',updatedAt:TS()});bt.update(db.collection('products').doc(p.id),{beta:true,status:'proses',concept:false});bt.commit().catch(gagal)};
    w.appendChild(b);return}
  var e1=el('button','btn sm','Ubah link beta');e1.type='button';
  e1.onclick=function(){db.collection('beta_links').doc(p.id).get().then(function(s){var u=prompt('Tautan uji coba beta (https://...):',s.exists?(s.data().link||''):'');if(u===null)return;var a=aman(u.trim());if(!a){alert('Tautan harus diawali https://');return}
    return db.collection('beta_links').doc(p.id).set({link:a,info:'',updatedAt:TS()})}).catch(gagal)};
  var e2=el('button','btn sm main','Rilis penuh');e2.type='button';
  e2.onclick=function(){if(!confirm('Konfirmasi: "'+p.name+'" sudah dirilis sepenuhnya? Aplikasi akan hilang dari menu uji coba dan tampil sebagai Tersedia di menu Produk.'))return;
    var u=prompt('Tempel tautan resmi produk (https://...) agar bisa dibuka dari menu Produk:',p.link||'');if(u===null)return;var a=aman(u.trim());if(!a){alert('Tautan harus diawali https://');return}
    var bt=db.batch();bt.update(db.collection('products').doc(p.id),{beta:false,status:'siap',concept:false,link:a});bt.delete(db.collection('beta_links').doc(p.id));bt.commit().catch(gagal)};
  w.appendChild(e1);w.appendChild(e2)}
/* --- admin: Site Key reCAPTCHA v3 untuk App Check (disimpan di Firestore, hanya admin yang bisa ubah) --- */
function ackOk(k){return typeof k==='string'&&/^6[A-Za-z0-9_-]{30,60}$/.test(k)}
function aktifkanAc(k,s){if(acAktif||!ackOk(k))return;try{firebase.appCheck().activate(k,true);acAktif=true;acSumber=s}catch(e){}}
function loadAc(){var i=$('acInfo');if(!i||!db)return;
  db.collection('settings').doc('appcheck').get().then(function(d){var k=d.exists?d.data().siteKey:'';
    i.textContent=(ackOk(k)?'Site Key tersimpan di server ('+k.slice(0,6)+'\u2026'+k.slice(-4)+').':'Belum ada Site Key di server.')+' Kunci di app.js: '+(ackOk(APPCHECK_SITE_KEY)?'terisi':'kosong')+'. Aktif di perangkat ini: '+(acAktif?'ya ('+acSumber+')':'belum')+'.'})
  .catch(function(){i.textContent='Tidak bisa memuat status.'})}
$('fAc').onsubmit=function(e){e.preventDefault();var f=e.target,m=$('mAc'),k=f.sitekey.value.trim();
  if(!ackOk(k)){note(m,'Format Site Key tidak dikenali. Site Key biasanya diawali 6L dan panjangnya sekitar 40 karakter.','err');return}
  if(!f.yakin.checked){note(m,'Centang dulu bahwa ini Site Key, bukan Secret Key.','err');return}
  note(m,'Menyimpan\u2026');
  db.collection('settings').doc('appcheck').set({siteKey:k,updatedAt:firebase.firestore.FieldValue.serverTimestamp()}).then(function(){f.reset();note(m,'Site Key tersimpan di server. Berlaku saat pengunjung memuat ulang halaman.','ok');loadAc()}).catch(function(x){note(m,galat(x),'err')})};
$('bAcHapus').onclick=function(){var m=$('mAc');if(!confirm('Hapus Site Key dari server? App Check tidak aktif lagi untuk pengunjung yang belum memakainya.'))return;
  db.collection('settings').doc('appcheck').delete().then(function(){note(m,'Site Key dihapus.','ok');loadAc()}).catch(function(x){note(m,galat(x),'err')})};
